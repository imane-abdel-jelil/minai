/**
 * Récupère les points d'eau de Mauritanie depuis WPDx (Water Point Data Exchange).
 *
 * Source : https://www.waterpointdata.org
 * API Socrata : https://data.waterpointdata.org/resource/eqje-vguj.json
 *
 * Différence avec OSM : WPDx renseigne le STATUT FONCTIONNEL (en panne / actif),
 * la date d'installation, et le type de gestion. C'est ce qui rend possible un
 * vrai score d'accès (un puits en panne = pas d'eau).
 *
 * Sortie : public/data/wpdx-points.geojson
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_PATH = path.join(ROOT, 'public', 'data', 'wpdx-points.geojson')

const ENDPOINT = 'https://data.waterpointdata.org/resource/eqje-vguj.json'
const PAGE_SIZE = 5000

// Mapping WPDx 'water_source_clean' → notre taxonomie interne (alignée OSM)
function normalizeKind(raw) {
  const s = (raw || '').toLowerCase()
  if (s.includes('borehole') || s.includes('tubewell')) return 'borehole'
  if (s.includes('hand dug well') || s.includes('dug well')) return 'well'
  if (s.includes('spring')) return 'spring'
  if (s.includes('piped') || s.includes('tap') || s.includes('kiosk')) return 'tap'
  if (s.includes('rainwater')) return 'other'
  if (s.includes('surface')) return 'other'
  return 'other'
}

// 'status_id' WPDx : "Yes" = fonctionnel, "No" = en panne, autre = inconnu
function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase().trim()
  if (s === 'yes') return 'functional'
  if (s === 'no') return 'non_functional'
  return 'unknown'
}

async function fetchAllMauritania() {
  const all = []
  let offset = 0
  while (true) {
    const url = new URL(ENDPOINT)
    url.searchParams.set('country_name', 'Mauritania')
    url.searchParams.set('$limit', String(PAGE_SIZE))
    url.searchParams.set('$offset', String(offset))
    process.stdout.write(`  page offset=${offset}…`)

    const r = await fetch(url, { headers: { 'User-Agent': 'MINAI/0.3' } })
    if (!r.ok) {
      console.log(` ❌ HTTP ${r.status}`)
      throw new Error(`WPDx API ${r.status}`)
    }
    const batch = await r.json()
    console.log(` ${batch.length} enregistrements`)
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    if (offset > 100000) break // garde-fou
  }
  return all
}

async function main() {
  console.log('🌍 Fetch WPDx — points d’eau de Mauritanie')
  console.log('   (source : Water Point Data Exchange)')
  console.log('')

  let raw
  try {
    raw = await fetchAllMauritania()
  } catch (e) {
    console.error('❌ Échec du fetch :', e.message)
    process.exit(1)
  }

  console.log(`\n📦 ${raw.length} enregistrements bruts récupérés`)

  // Conversion en GeoJSON
  let kept = 0
  let skipped = 0
  const counts = { functional: 0, non_functional: 0, unknown: 0 }
  const features = []

  for (const row of raw) {
    const lat = parseFloat(row.lat_deg)
    const lon = parseFloat(row.lon_deg)
    if (!isFinite(lat) || !isFinite(lon) || lat === 0 || lon === 0) {
      skipped++
      continue
    }
    const kind = normalizeKind(row.water_source_clean)
    const status = normalizeStatus(row.status_id)
    counts[status]++
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        id: row.row_id || row['#id'] || `wpdx-${kept}`,
        kind,
        status,
        name: row.water_point_name || null,
        adm1: row.adm1 || null,
        adm2: row.adm2 || null,
        installYear: row.install_year ? parseInt(row.install_year, 10) : null,
        techClean: row.water_tech_clean || null,
        sourceClean: row.water_source_clean || null,
        category: row.water_source_category || null,
        reportDate: row.report_date || null,
        source: 'WPDx',
      },
    })
    kept++
  }

  console.log(`✅ ${kept} points valides (${skipped} ignorés faute de coordonnées)`)
  console.log(`   • ${counts.functional} fonctionnels`)
  console.log(`   • ${counts.non_functional} en panne`)
  console.log(`   • ${counts.unknown} statut inconnu`)
  if (kept > 0) {
    const pctFunc = Math.round((counts.functional / kept) * 100)
    console.log(`   → ${pctFunc}% des points WPDx sont fonctionnels`)
  }

  const fc = { type: 'FeatureCollection', features }
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
  await fs.writeFile(OUT_PATH, JSON.stringify(fc))
  const size = (await fs.stat(OUT_PATH)).size
  console.log(`\n💾 Écrit dans ${OUT_PATH}`)
  console.log(`   ${(size / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
