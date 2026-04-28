#!/usr/bin/env node
/**
 * Fetch les frontières (polygones) des 13 wilayas de Mauritanie
 * Source principale : geoBoundaries (open data, OSM-based, déjà nettoyé)
 * Fallback : Overpass API (admin_level=4)
 *
 * Output : public/data/wilayas.geojson
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'wilayas.geojson')

// ---------------------------------------------------------------------------
// 1. geoBoundaries (preferred — clean GeoJSON, no assembly needed)
// ---------------------------------------------------------------------------
const GEOBOUNDARIES_URLS = [
  // Mirror 1 : raw GitHub
  'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/MRT/ADM1/geoBoundaries-MRT-ADM1.geojson',
  // Mirror 2 : geoBoundaries CDN
  'https://www.geoboundaries.org/data/geoBoundaries-3_0_0/MRT/ADM1/geoBoundaries-3_0_0-MRT-ADM1.geojson',
]

async function fetchGeoBoundaries() {
  console.log('🗺️   Téléchargement des frontières via geoBoundaries...')
  let lastErr = null
  for (const url of GEOBOUNDARIES_URLS) {
    try {
      console.log(`   → ${new URL(url).host}`)
      const r = await fetch(url, {
        headers: { 'User-Agent': 'MINAI-Mauritania/1.0 (contact: imaneahmedou1@gmail.com)' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      if (data.features && data.features.length >= 13) {
        console.log(`   ✅ ${data.features.length} wilayas trouvées via geoBoundaries`)
        return data
      }
      console.log(`      ⚠️  Réponse invalide (${data.features?.length || 0} features)`)
    } catch (e) {
      console.log(`      ⚠️  ${e.message}`)
      lastErr = e
    }
  }
  throw new Error(`Tous les miroirs geoBoundaries ont échoué — ${lastErr?.message}`)
}

// ---------------------------------------------------------------------------
// 2. Overpass fallback (admin_level=4 relations)
// ---------------------------------------------------------------------------
const MIRRORS_OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
]

const OVERPASS_QUERY = `
[out:json][timeout:120];
area["ISO3166-1"="MR"][admin_level=2]->.mr;
relation["admin_level"="4"](area.mr);
out geom;
`

async function fetchOverpass() {
  console.log('🌍  Fallback : OpenStreetMap (Overpass API)...')
  let data = null
  let lastErr = null
  for (const url of MIRRORS_OVERPASS) {
    try {
      console.log(`   → ${new URL(url).host}`)
      const full = url + '?data=' + encodeURIComponent(OVERPASS_QUERY)
      const r = await fetch(full, {
        headers: { 'User-Agent': 'MINAI-Mauritania/1.0 (contact: imaneahmedou1@gmail.com)' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      data = await r.json()
      console.log(`   ✅ Succès`)
      break
    } catch (e) {
      console.log(`      ⚠️  ${e.message}`)
      lastErr = e
    }
  }
  if (!data) throw new Error(`Overpass échoué — ${lastErr?.message}`)

  // Convertit les relations OSM en polygones GeoJSON
  // Méthode simple : on assemble les `outer` ways en LineStrings puis MultiPolygon
  const features = []
  for (const rel of data.elements || []) {
    if (rel.type !== 'relation' || !rel.members) continue
    const outerRings = []
    for (const m of rel.members) {
      if (m.type !== 'way' || m.role !== 'outer' || !m.geometry) continue
      const coords = m.geometry.map((p) => [p.lon, p.lat])
      outerRings.push(coords)
    }
    if (outerRings.length === 0) continue

    // Assemble les rings : on les concatène (méthode simplifiée)
    // Pour un assemblage complet il faudrait osmtogeojson, mais Mauritanie a
    // des wilayas simples — on fait au plus simple
    const mergedRings = mergeRings(outerRings)

    features.push({
      type: 'Feature',
      geometry: {
        type: mergedRings.length === 1 ? 'Polygon' : 'MultiPolygon',
        coordinates: mergedRings.length === 1
          ? [mergedRings[0]]
          : mergedRings.map((r) => [r]),
      },
      properties: {
        osm_id: rel.id,
        shapeName: rel.tags?.['name:fr'] || rel.tags?.name || rel.tags?.['name:en'] || 'Wilaya',
        nameAr: rel.tags?.['name:ar'] || null,
        admin_level: rel.tags?.admin_level || null,
      },
    })
  }
  console.log(`   ✅ ${features.length} wilayas reconstruites depuis OSM`)
  return { type: 'FeatureCollection', features }
}

// Helper : tente de fusionner des rings ouverts en rings fermés
function mergeRings(rings) {
  const result = []
  const used = new Array(rings.length).fill(false)
  for (let i = 0; i < rings.length; i++) {
    if (used[i]) continue
    let current = [...rings[i]]
    used[i] = true
    let extended = true
    while (extended) {
      extended = false
      const last = current[current.length - 1]
      for (let j = 0; j < rings.length; j++) {
        if (used[j]) continue
        const r = rings[j]
        if (r[0][0] === last[0] && r[0][1] === last[1]) {
          current = current.concat(r.slice(1))
          used[j] = true
          extended = true
          break
        }
        const rEnd = r[r.length - 1]
        if (rEnd[0] === last[0] && rEnd[1] === last[1]) {
          current = current.concat(r.slice(0, -1).reverse())
          used[j] = true
          extended = true
          break
        }
      }
    }
    // ferme le ring si pas encore fermé
    const first = current[0]
    const last = current[current.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) current.push(first)
    result.push(current)
  }
  return result
}

// ---------------------------------------------------------------------------
// Normalisation des noms (geoBoundaries utilise parfois shapeName / Name)
// ---------------------------------------------------------------------------
function normalizeFeatures(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const p = f.properties || {}
      const name =
        p.shapeName ||
        p.name ||
        p.NAME_1 ||
        p.NAME ||
        p.ADM1_FR ||
        p.ADM1_EN ||
        'Wilaya'
      return {
        ...f,
        properties: {
          ...p,
          shapeName: name,
        },
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let geojson
  try {
    geojson = await fetchGeoBoundaries()
  } catch (e) {
    console.warn(`⚠️  geoBoundaries indisponible (${e.message}), bascule sur Overpass...`)
    geojson = await fetchOverpass()
  }

  geojson = normalizeFeatures(geojson)

  // Métadonnées
  geojson.metadata = {
    generated_at: new Date().toISOString(),
    count: geojson.features.length,
    country: 'Mauritania (ISO MR)',
    admin_level: 'ADM1 (wilayas)',
  }

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
  await fs.writeFile(OUT_PATH, JSON.stringify(geojson))
  const sizeKB = ((await fs.stat(OUT_PATH)).size / 1024).toFixed(1)
  console.log('')
  console.log(`✅✅ ${geojson.features.length} wilayas sauvées dans public/data/wilayas.geojson (${sizeKB} KB)`)

  // Liste les noms trouvés
  console.log('')
  console.log('📋  Wilayas récupérées :')
  geojson.features
    .map((f) => f.properties.shapeName)
    .sort()
    .forEach((n, i) => console.log(`   ${i + 1}. ${n}`))
}

main().catch((err) => {
  console.error('❌', err.message || err)
  process.exit(1)
})
