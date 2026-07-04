/**
 * MINAI · Import des données géographiques dans Supabase (PostGIS)
 * ================================================================
 *
 * Lit les 4 fichiers GeoJSON de public/data/ et insère leur contenu
 * dans les tables PostGIS créées par supabase/geodata_schema.sql.
 *
 * PRÉ-REQUIS
 * ----------
 *   1. Le script SQL supabase/geodata_schema.sql a été exécuté dans
 *      Supabase → SQL Editor (les tables villages/water_points/wilayas
 *      existent et sont vides).
 *
 *   2. Deux variables d'environnement dans .env :
 *        VITE_SUPABASE_URL             — l'URL du projet
 *        SUPABASE_SERVICE_ROLE_KEY     — la clé secrète service_role
 *
 *      La service_role bypass la RLS pour permettre l'import massif.
 *      Récupère-la dans Supabase → Settings → API → 'service_role secret'.
 *      NE JAMAIS commiter cette clé, ne jamais l'utiliser côté frontend.
 *
 * USAGE
 * -----
 *      npm run import:geodata
 *
 * IDEMPOTENT
 * ----------
 * Le script fait des UPSERT (INSERT ... ON CONFLICT ... UPDATE), donc
 * tu peux le relancer plusieurs fois sans dupliquer les lignes.
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(ROOT, 'public/data')

// ─── Config ────────────────────────────────────────────────────────

// Lit manuellement le .env (Vite l'utilise déjà côté frontend, mais
// on est dans un script Node ici, donc on parse à la main).
const env = await parseEnv(resolve(ROOT, '.env'))
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '❌ Variables Supabase manquantes.\n' +
      "   Ajoute dans .env :\n" +
      "     VITE_SUPABASE_URL=https://<ton-projet>.supabase.co\n" +
      "     SUPABASE_SERVICE_ROLE_KEY=<ta clé secrète service_role>\n\n" +
      "   Récupère la clé secrète dans Supabase → Settings → API.\n" +
      "   ⚠️  Ne jamais commiter la service_role key."
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Utilitaires ───────────────────────────────────────────────────

/** Convertit une géométrie GeoJSON en EWKT (avec SRID 4326). */
function toEwkt(geom) {
  if (!geom || !geom.type) throw new Error('Géométrie invalide')
  if (geom.type === 'Point') {
    const [x, y] = geom.coordinates
    return `SRID=4326;POINT(${x} ${y})`
  }
  if (geom.type === 'Polygon') {
    const rings = geom.coordinates
      .map((ring) => '(' + ring.map((p) => `${p[0]} ${p[1]}`).join(',') + ')')
      .join(',')
    return `SRID=4326;POLYGON(${rings})`
  }
  if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates
      .map(
        (poly) =>
          '(' +
          poly
            .map((ring) => '(' + ring.map((p) => `${p[0]} ${p[1]}`).join(',') + ')')
            .join(',') +
          ')',
      )
      .join(',')
    return `SRID=4326;MULTIPOLYGON(${polys})`
  }
  throw new Error(`Type de géométrie non supporté : ${geom.type}`)
}

/** Insère un batch de lignes dans une table Supabase, avec retry. */
async function upsertBatch(table, rows, onConflict) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })
  if (error) {
    console.error(`\n❌ Erreur upsert dans ${table} :`, error.message)
    throw error
  }
}

/** Progresse par batch de N lignes avec barre visuelle simple. */
async function upsertInBatches(table, rows, onConflict, batchSize = 500) {
  const total = rows.length
  let done = 0
  for (let i = 0; i < total; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    await upsertBatch(table, batch, onConflict)
    done += batch.length
    const pct = Math.round((done / total) * 100)
    process.stdout.write(`\r    ${done.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')} (${pct}%)`)
  }
  process.stdout.write('\n')
}

async function parseEnv(path) {
  try {
    const txt = await readFile(path, 'utf-8')
    const env = {}
    for (const line of txt.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const k = trimmed.slice(0, idx).trim()
      const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      env[k] = v
    }
    return env
  } catch {
    return {}
  }
}

async function loadGeoJson(name) {
  const path = resolve(DATA_DIR, name)
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw)
}

// ─── Étape 1 : import des VILLAGES (ANSADE RGPH-5 + scoring) ──────

async function importVillages() {
  console.log('\n🏘  Import villages…')
  const gj = await loadGeoJson('villages-scored.geojson')
  console.log(`    ${gj.features.length.toLocaleString('fr-FR')} features à traiter`)

  const rows = []
  for (const f of gj.features) {
    if (!f.geometry || f.geometry.type !== 'Point') continue
    const p = f.properties || {}
    const codeLocalite = Number(p.code_localite)
    if (!Number.isFinite(codeLocalite)) continue

    rows.push({
      code_localite:        codeLocalite,
      name_fr:              String(p.nom_fr || '(sans nom)'),
      name_ar:              p.nom_ar ?? null,
      wilaya:               p.wilaya ?? null,
      wilaya_id:            p.wilayaId ?? null,
      moughataa:            p.moughataa ?? null,
      moughataa_ar:         p.moughataa_ar ?? null,
      commune:              p.commune ?? null,
      commune_ar:           p.commune_ar ?? null,
      population_total:     Number(p.population_total) || 0,
      population_femmes:    p.population_femmes != null ? Number(p.population_femmes) : null,
      population_hommes:    p.population_hommes != null ? Number(p.population_hommes) : null,
      reseau_aep:           p.reseau_aep === 'Oui',
      electricite:          p.electricite ?? null,
      geom:                 toEwkt(f.geometry),
      distance_to_water_km: p.distance_to_water_km != null ? Number(p.distance_to_water_km) : null,
      nearest_water_lng:    p.nearest_water_lng ?? null,
      nearest_water_lat:    p.nearest_water_lat ?? null,
      nearest_water_type:   p.nearest_water_type ?? null,
      status:               p.status ?? null,
      priority_score:       p.priority_score != null ? Number(p.priority_score) : null,
      is_top_priority:      p.is_top_priority === 1 || p.is_top_priority === true,
      is_success_story:     p.is_success_story === 1 || p.is_success_story === true,
    })
  }

  console.log(`    ${rows.length.toLocaleString('fr-FR')} lignes prêtes à upsert`)
  await upsertInBatches('villages', rows, 'code_localite')
  console.log(`    ✓ ${rows.length.toLocaleString('fr-FR')} villages importés`)
}

// ─── Étape 2 : import des WATER_POINTS ─────────────────────────────
// On importe deux sources : ANSADE (points_eau.geojson) et OSM (water-points.geojson)

async function importWaterPoints() {
  console.log('\n💧 Import water_points…')
  const all = []

  // ─── ANSADE ────────────────────────────────────────────────────
  try {
    const ansade = await loadGeoJson('points_eau.geojson')
    console.log(`    ANSADE : ${ansade.features.length.toLocaleString('fr-FR')} features`)
    for (const f of ansade.features) {
      if (!f.geometry || f.geometry.type !== 'Point') continue
      const p = f.properties || {}
      all.push({
        code_localite:      p.code_localite != null ? Number(p.code_localite) : null,
        name:               p.nom ?? null,
        type:               p.type ?? null,
        kind:               null,
        categorie:          p.categorie ?? null,
        source:             'ANSADE',
        wilaya:             p.wilaya ?? null,
        moughataa:          p.moughataa ?? null,
        commune:            p.commune ?? null,
        drinkable:          null,
        operational_status: null,
        geom:               toEwkt(f.geometry),
      })
    }
  } catch (e) {
    console.log(`    ANSADE : (fichier absent ou illisible : ${e.message})`)
  }

  // ─── OSM ───────────────────────────────────────────────────────
  try {
    const osm = await loadGeoJson('water-points.geojson')
    console.log(`    OSM    : ${osm.features.length.toLocaleString('fr-FR')} features`)
    for (const f of osm.features) {
      if (!f.geometry || f.geometry.type !== 'Point') continue
      const p = f.properties || {}
      all.push({
        code_localite:      null,
        name:               p.name ?? null,
        type:               null,
        kind:               p.kind ?? 'other',
        categorie:          null,
        source:             'OSM',
        wilaya:             null,
        moughataa:          null,
        commune:            null,
        drinkable:          p.drinkable ?? null,
        operational_status: p.status ?? null,
        geom:               toEwkt(f.geometry),
      })
    }
  } catch (e) {
    console.log(`    OSM    : (fichier absent ou illisible : ${e.message})`)
  }

  console.log(`    ${all.length.toLocaleString('fr-FR')} lignes prêtes à upsert`)

  // On vide la table avant re-import pour éviter les doublons (pas
  // de clé naturelle pour upsert sur water_points).
  const { error: delErr } = await supabase.from('water_points').delete().gte('created_at', '2000-01-01')
  if (delErr) {
    console.error('    ⚠️  Impossible de nettoyer la table :', delErr.message)
  }

  // Insert simple (pas d'upsert car pas de clé naturelle)
  const total = all.length
  let done = 0
  const batchSize = 500
  for (let i = 0; i < total; i += batchSize) {
    const batch = all.slice(i, i + batchSize)
    const { error } = await supabase.from('water_points').insert(batch)
    if (error) {
      console.error('\n❌ Erreur insert water_points :', error.message)
      throw error
    }
    done += batch.length
    const pct = Math.round((done / total) * 100)
    process.stdout.write(`\r    ${done.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')} (${pct}%)`)
  }
  process.stdout.write('\n')
  console.log(`    ✓ ${total.toLocaleString('fr-FR')} points d'eau importés`)
}

// ─── Étape 3 : import des WILAYAS ─────────────────────────────────

async function importWilayas() {
  console.log('\n🗺  Import wilayas…')
  const gj = await loadGeoJson('wilayas.geojson')
  console.log(`    ${gj.features.length.toLocaleString('fr-FR')} features à traiter`)

  const { MAURITANIA_REGIONS } = await import(
    resolve(ROOT, 'src/data/mauritania-regions.ts')
  ).catch(async () => {
    // .ts pas exécutable directement — on va parser le fichier
    return await extractRegionsFromTs()
  })

  // Fallback : si on ne peut pas importer, on tape simple sur le nom
  const rows = []
  for (const f of gj.features) {
    if (!f.geometry) continue
    let geom = f.geometry
    // On force en MultiPolygon (wrap Polygon si nécessaire)
    if (geom.type === 'Polygon') {
      geom = { type: 'MultiPolygon', coordinates: [geom.coordinates] }
    }
    if (geom.type !== 'MultiPolygon') continue

    const props = f.properties || {}
    const shapeName = props.shapeName || props.name || props.regionName || ''
    const wilayaId = props.regionId || findWilayaIdByName(shapeName, MAURITANIA_REGIONS)
    if (!wilayaId) {
      console.warn(`    ⚠️  Wilaya sans id : ${shapeName}`)
      continue
    }

    rows.push({
      id:         wilayaId,
      name:       props.regionName || shapeName,
      shape_name: shapeName,
      geom:       toEwkt(geom),
      population: null,
      capital:    null,
    })
  }

  console.log(`    ${rows.length.toLocaleString('fr-FR')} wilayas prêtes`)
  await upsertInBatches('wilayas', rows, 'id')
  console.log(`    ✓ ${rows.length.toLocaleString('fr-FR')} wilayas importées`)
}

async function extractRegionsFromTs() {
  const path = resolve(ROOT, 'src/data/mauritania-regions.ts')
  try {
    const txt = await readFile(path, 'utf-8')
    // Extraction très naïve : on cherche des { id: 'XXX', name: 'YYY', ... }
    const regions = []
    const re = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]/g
    let m
    while ((m = re.exec(txt)) !== null) {
      regions.push({ id: m[1], name: m[2] })
    }
    return { MAURITANIA_REGIONS: regions }
  } catch {
    return { MAURITANIA_REGIONS: [] }
  }
}

function normName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

function findWilayaIdByName(name, regions) {
  if (!name) return null
  const target = normName(name)
  if (target.includes('nouakchott')) return 'NKC'
  const exact = regions.find((r) => normName(r.name) === target)
  if (exact) return exact.id
  const partial = regions.find(
    (r) => target.includes(normName(r.name)) || normName(r.name).includes(target),
  )
  return partial?.id ?? null
}

// ─── Étape 4 : vérification finale ────────────────────────────────

async function verify() {
  console.log('\n🔎 Vérification en base…')
  const counts = await Promise.all([
    supabase.from('villages').select('*', { count: 'exact', head: true }),
    supabase.from('water_points').select('*', { count: 'exact', head: true }),
    supabase.from('wilayas').select('*', { count: 'exact', head: true }),
  ])
  const [v, wp, w] = counts.map((r) => r.count ?? 0)
  console.log(`    villages     : ${v.toLocaleString('fr-FR')}`)
  console.log(`    water_points : ${wp.toLocaleString('fr-FR')}`)
  console.log(`    wilayas      : ${w.toLocaleString('fr-FR')}`)

  // Bonus : top 3 villages critiques les plus peuplés pour valider
  const { data: top } = await supabase
    .from('villages')
    .select('name_fr, wilaya, population_total, distance_to_water_km')
    .eq('status', 'critical')
    .order('priority_score', { ascending: false })
    .limit(3)
  if (top?.length) {
    console.log('\n    Top 3 priorités absolues (vérif rapide) :')
    for (const v of top) {
      console.log(`      · ${v.name_fr.padEnd(24)} pop=${String(v.population_total).padStart(6)}  d=${v.distance_to_water_km} km  ${v.wilaya}`)
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('🇲🇷  MINAI · Import données géo vers Supabase')
  console.log('════════════════════════════════════════════')

  await importVillages()
  await importWaterPoints()
  await importWilayas()
  await verify()

  console.log('\n✨  Terminé.')
  console.log('    Le frontend continue à lire les fichiers geojson statiques.')
  console.log('    On basculera vers Supabase après ton pitch.')
}

main().catch((e) => {
  console.error('\n💥  Erreur fatale :', e.message)
  process.exit(1)
})
