/**
 * compute-village-scores.mjs
 *
 * Pré-calcule pour chaque village ANSADE (villages.geojson) :
 *   - distance_to_water_km : distance haversine au point d'eau le plus proche
 *   - nearest_water_lng / nearest_water_lat : coords de ce point d'eau
 *   - nearest_water_type : type (Puits / Forage)
 *   - status : 'critical' | 'risk' | 'ok'
 *   - priority_score : pour classement (population × distance × multiplicateur)
 *
 * RÈGLES STATUT
 *   - reseau_aep === 'Oui' (déjà sur réseau d'eau potable) → 'ok'
 *   - distance > 5 km → 'critical'
 *   - distance > 2 km → 'risk'
 *   - sinon → 'ok'
 *
 * PERFORMANCE
 *   8 447 villages × 6 201 points d'eau = 52 M distances haversine.
 *   Avec un bucket spatial 1°×1° on tombe à ~3 M opérations (≈ 3 s).
 *
 * USAGE
 *   npm run compute:scores
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DATA_DIR  = resolve(ROOT, 'public/data')

const VILLAGES_IN  = resolve(DATA_DIR, 'villages.geojson')
const WATER_IN     = resolve(DATA_DIR, 'points_eau.geojson')
const VILLAGES_OUT = resolve(DATA_DIR, 'villages-scored.geojson')

// ─── Distance haversine ────────────────────────────────────────────────────
function toRad(d) { return (d * Math.PI) / 180 }
function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// ─── Bucket spatial : grille 1° × 1° ───────────────────────────────────────
function gridKey(lng, lat) {
  return `${Math.floor(lng)}_${Math.floor(lat)}`
}
function neighborKeys(lng, lat) {
  const cx = Math.floor(lng)
  const cy = Math.floor(lat)
  const keys = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`${cx + dx}_${cy + dy}`)
    }
  }
  return keys
}

// ─── Statut ────────────────────────────────────────────────────────────────
function computeStatus(props, distKm) {
  if (props.reseau_aep === 'Oui') return 'ok'
  if (distKm > 5) return 'critical'
  if (distKm > 2) return 'risk'
  return 'ok'
}
function priorityScore(props, distKm, status) {
  const pop = Number(props.population_total) || 0
  const mul = status === 'critical' ? 1.5 : status === 'risk' ? 1 : 0.3
  return Math.round(distKm * pop * mul)
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🇲🇷  MINAI — pré-calcul des scores village')
  console.log('───────────────────────────────────────────')

  console.log(`\n📥  Lecture des fichiers d'entrée…`)
  const villages = JSON.parse(await readFile(VILLAGES_IN, 'utf-8'))
  const waters = JSON.parse(await readFile(WATER_IN, 'utf-8'))
  console.log(`    Villages       : ${villages.features.length.toLocaleString('fr-FR')}`)
  console.log(`    Points d'eau   : ${waters.features.length.toLocaleString('fr-FR')}`)

  // Index spatial des points d'eau par grille 1°×1°
  console.log('\n📦  Indexation spatiale des points d\'eau…')
  const buckets = new Map()
  for (const w of waters.features) {
    if (w.geometry?.type !== 'Point') continue
    const [lng, lat] = w.geometry.coordinates
    const k = gridKey(lng, lat)
    if (!buckets.has(k)) buckets.set(k, [])
    buckets.get(k).push(w)
  }
  console.log(`    ${buckets.size} cellules de grille remplies`)

  console.log('\n⚙︎  Calcul des distances et statuts…')
  const t0 = Date.now()
  let cmpCount = 0
  let okCount = 0
  let riskCount = 0
  let critCount = 0
  let withRes = 0

  for (let i = 0; i < villages.features.length; i++) {
    const v = villages.features[i]
    if (v.geometry?.type !== 'Point') continue
    const [vlng, vlat] = v.geometry.coordinates
    const props = v.properties || {}

    // Cherche les points d'eau dans les 9 cellules adjacentes
    let minDist = Infinity
    let nearest = null
    for (const k of neighborKeys(vlng, vlat)) {
      const cell = buckets.get(k)
      if (!cell) continue
      for (const w of cell) {
        cmpCount++
        const d = haversineKm([vlng, vlat], w.geometry.coordinates)
        if (d < minDist) {
          minDist = d
          nearest = w
        }
      }
    }

    // Si rien trouvé dans les 9 cellules adjacentes (village isolé en plein
    // désert), on retombe sur un balayage complet — rare.
    if (!nearest) {
      for (const w of waters.features) {
        cmpCount++
        const d = haversineKm([vlng, vlat], w.geometry.coordinates)
        if (d < minDist) {
          minDist = d
          nearest = w
        }
      }
    }

    const status = computeStatus(props, minDist)
    const score = priorityScore(props, minDist, status)
    const wlng = nearest?.geometry?.coordinates?.[0] ?? null
    const wlat = nearest?.geometry?.coordinates?.[1] ?? null
    const wtype = nearest?.properties?.type ?? null

    v.properties = {
      ...props,
      distance_to_water_km: Number(minDist.toFixed(2)),
      nearest_water_lng: wlng,
      nearest_water_lat: wlat,
      nearest_water_type: wtype,
      status,
      priority_score: score,
    }

    if (props.reseau_aep === 'Oui') withRes++
    if (status === 'ok') okCount++
    else if (status === 'risk') riskCount++
    else critCount++

    if ((i + 1) % 1000 === 0) {
      process.stdout.write(`    ${i + 1} villages traités…\n`)
    }
  }

  const dt = Date.now() - t0
  console.log(`\n    ✔︎ ${villages.features.length.toLocaleString('fr-FR')} villages scorés en ${(dt / 1000).toFixed(1)} s`)
  console.log(`    ✔︎ ${cmpCount.toLocaleString('fr-FR')} comparaisons haversine`)

  console.log('\n📊  Distribution des statuts')
  console.log(`    🟢 OK         : ${okCount.toLocaleString('fr-FR')}`)
  console.log(`       dont déjà sur réseau AEP : ${withRes.toLocaleString('fr-FR')}`)
  console.log(`    🟠 Risque     : ${riskCount.toLocaleString('fr-FR')}`)
  console.log(`    🔴 Critique   : ${critCount.toLocaleString('fr-FR')}`)

  console.log('\n💾  Écriture du fichier scoré…')
  await writeFile(VILLAGES_OUT, JSON.stringify(villages, null, 2), 'utf-8')
  console.log(`    ${VILLAGES_OUT}`)

  console.log('\n✨  Terminé.')
}

main().catch((e) => {
  console.error('💥  Erreur :', e)
  process.exit(1)
})
