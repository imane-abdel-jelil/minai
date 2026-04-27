#!/usr/bin/env node
/**
 * Fetch real water points in Mauritania from:
 *  1. OpenStreetMap (Overpass API)  — drinking_water, wells, taps, boreholes, springs
 *  2. WPDx (Water Point Data Exchange)  — UNICEF/Worldbank reference dataset
 *
 * Output: public/data/water-points.geojson  (merged GeoJSON FeatureCollection)
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'water-points.geojson')

const MIRRORS_OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// Smaller, focused query to reduce timeout risk
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="MR"][admin_level=2]->.mr;
(
  node["amenity"="drinking_water"](area.mr);
  node["amenity"="water_point"](area.mr);
  node["man_made"="water_well"](area.mr);
  node["man_made"="water_tap"](area.mr);
  node["man_made"="borehole"](area.mr);
  node["man_made"="water_works"](area.mr);
  node["natural"="spring"](area.mr);
);
out body;
`

async function tryOverpass(url) {
  const full = url + '?data=' + encodeURIComponent(OVERPASS_QUERY)
  console.log(`   → ${url}`)
  const r = await fetch(full, {
    headers: { 'User-Agent': 'MINAI-Mauritania/1.0 (contact: imaneahmedou1@gmail.com)' },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

async function fetchOSM() {
  console.log('🌍  Téléchargement OpenStreetMap (Overpass API)...')
  let data = null
  let lastErr = null
  for (const url of MIRRORS_OVERPASS) {
    try {
      data = await tryOverpass(url)
      console.log(`   ✅ Succès via ${new URL(url).host}`)
      break
    } catch (e) {
      console.log(`      ⚠️  ${e.message}, j'essaie le miroir suivant...`)
      lastErr = e
    }
  }
  if (!data) throw new Error(`Tous les miroirs Overpass ont échoué — dernière erreur : ${lastErr?.message}`)

  const features = (data.elements || [])
    .filter((e) => e.type === 'node' && e.lat && e.lon)
    .map((e) => {
      const t = e.tags || {}
      const kind =
        t.amenity === 'drinking_water'
          ? 'drinking_water'
          : t.amenity === 'water_point'
          ? 'water_point'
          : t.man_made === 'water_well'
          ? 'well'
          : t.man_made === 'borehole'
          ? 'borehole'
          : t.man_made === 'water_tap'
          ? 'tap'
          : t.man_made === 'water_works'
          ? 'water_works'
          : t.natural === 'spring'
          ? 'spring'
          : 'other'

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
        properties: {
          source: 'OSM',
          osm_id: e.id,
          kind,
          name: t.name || t['name:fr'] || t['name:ar'] || null,
          drinkable: t.drinking_water || t.potable || null,
          access: t.access || null,
          operator: t.operator || null,
        },
      }
    })

  console.log(`   ✅ ${features.length} points trouvés via OSM`)
  return features
}

// ---------------------------------------------------------------------------
// 2. WPDx via Socrata Open Data API — try multiple parameter shapes
// ---------------------------------------------------------------------------
const WPDX_BASE = 'https://data.waterpointdata.org/resource/eqje-vguj.json'

async function fetchWPDx() {
  console.log('💧  Téléchargement WPDx (Water Point Data Exchange)...')

  // Try several filter forms — WPDx schema sometimes varies
  const variants = [
    { country_name: 'Mauritania', $limit: '50000' },
    { clean_country_name: 'Mauritania', $limit: '50000' },
    { country_id: 'MRT', $limit: '50000' },
    { clean_country_id: 'MRT', $limit: '50000' },
  ]

  let rows = []
  for (const params of variants) {
    const url = WPDX_BASE + '?' + new URLSearchParams(params)
    try {
      console.log(`   → ${decodeURIComponent(new URLSearchParams(params).toString())}`)
      const r = await fetch(url)
      if (!r.ok) {
        console.log(`      ⚠️  HTTP ${r.status}`)
        continue
      }
      const data = await r.json()
      if (Array.isArray(data) && data.length > 0) {
        console.log(`      ✅ ${data.length} lignes`)
        rows = data
        break
      } else {
        console.log(`      0 ligne`)
      }
    } catch (e) {
      console.log(`      ⚠️  ${e.message}`)
    }
  }

  if (rows.length === 0) {
    console.warn('   ⚠️  WPDx : aucune donnée récupérée — on continue avec OSM seul')
    return []
  }

  // Coordonnées : champs possibles selon version du dataset
  const features = rows
    .map((row) => {
      const lat = parseFloat(row.lat_deg ?? row.latitude ?? row.location?.latitude)
      const lon = parseFloat(row.lon_deg ?? row.longitude ?? row.location?.longitude)
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          source: 'WPDx',
          wpdx_id: row.wpdx_id || row.row_id || null,
          kind:
            row.water_source_clean ||
            row.water_source ||
            row.water_source_category ||
            'other',
          name: row.water_point_name || row.facility_name || null,
          status: row.status_id || row.status_clean || row.status || null,
          install_year: row.install_year || null,
          management: row.management_clean || row.management || null,
          adm1: row.clean_adm1 || row.adm1 || null,
          adm2: row.clean_adm2 || row.adm2 || null,
        },
      }
    })
    .filter(Boolean)

  console.log(`   ✅ ${features.length} points WPDx avec coordonnées valides`)
  return features
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const [osm, wpdx] = await Promise.allSettled([fetchOSM(), fetchWPDx()])
  const features = []
  if (osm.status === 'fulfilled') features.push(...osm.value)
  else console.error('❌ OSM:', osm.reason?.message)
  if (wpdx.status === 'fulfilled') features.push(...wpdx.value)
  else console.error('❌ WPDx:', wpdx.reason?.message)

  if (features.length === 0) {
    throw new Error('Aucun point récupéré — réessaie dans 2 min (Overpass est parfois surchargé)')
  }

  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generated_at: new Date().toISOString(),
      count: features.length,
      sources: ['OpenStreetMap (Overpass API)', 'WPDx (Water Point Data Exchange)'],
      country: 'Mauritania (ISO MR)',
    },
    features,
  }

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
  await fs.writeFile(OUT_PATH, JSON.stringify(geojson))
  const sizeKB = ((await fs.stat(OUT_PATH)).size / 1024).toFixed(1)
  console.log('')
  console.log(`✅✅ ${features.length} points sauvés dans public/data/water-points.geojson (${sizeKB} KB)`)

  // Petit résumé par source
  const bySrc = {}
  for (const f of features) bySrc[f.properties.source] = (bySrc[f.properties.source] || 0) + 1
  console.log('   Répartition par source :', bySrc)
}

main().catch((err) => {
  console.error('❌', err.message || err)
  process.exit(1)
})
