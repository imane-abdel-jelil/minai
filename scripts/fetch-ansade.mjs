/**
 * fetch-ansade.mjs
 *
 * Extrait les données ANSADE (RGPH-5) depuis le dashboard ArcGIS Experience
 * officiel de la Mauritanie, et produit 3 fichiers GeoJSON propres :
 *
 *   public/data/villages.geojson      — toutes les localités
 *   public/data/points_eau.geojson    — tous les points d'eau
 *   public/data/mapping_types.json    — correspondance types arabes → français
 *
 * MÉTHODE
 * 1. Récupère le config JSON de l'Experience (api publique ArcGIS Online)
 * 2. Identifie les FeatureServer pour "villages" et "points d'eau" via
 *    leur nom de couche
 * 3. Paginate (max 2000 features par requête, ArcGIS plafonne)
 * 4. Mappe les champs ANSADE (français/arabe) → schéma MINAI propre
 * 5. Écrit les 3 fichiers en sortie
 *
 * USAGE :
 *   npm run fetch:ansade
 *   ou : node scripts/fetch-ansade.mjs
 *
 * Si la découverte automatique échoue (config inaccessible, structure
 * différente, etc.), tu peux passer les URLs directement en variables
 * d'environnement :
 *   ANSADE_VILLAGES_URL='https://...' ANSADE_POINTS_EAU_URL='https://...' \
 *     node scripts/fetch-ansade.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── CONFIG ────────────────────────────────────────────────────────────────

const EXPERIENCE_ID = '2ded1160faac4295861634a47ff18d03'
const ARCGIS_ITEM_API = `https://www.arcgis.com/sharing/rest/content/items/${EXPERIENCE_ID}/data?f=json`

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const OUTPUT_DIR = resolve(PROJECT_ROOT, 'public/data')

const PAGE_SIZE = 2000 // ArcGIS plafond standard

// Mots-clés pour identifier les couches dans le config
const KEYWORDS_VILLAGES = ['localit', 'village', 'rgph', 'population']
const KEYWORDS_POINTS_EAU = ['eau', 'forage', 'puit', 'water', 'borehole', 'well', 'حفر', 'بئر']

// Schéma MINAI — clés cibles, et les variantes ANSADE possibles
const VILLAGE_FIELDS = {
  code_localite:    ['CODE_LOCALITE', 'code_loc', 'code_localite', 'CODE_LOC', 'OBJECTID', 'CODE'],
  nom_fr:           ['NOM_LOC_FR', 'NOM_LOCALITE', 'NOM_FR', 'nom_fr', 'LOCALITE', 'NOM_LOC', 'NOM'],
  population_total: ['POPULATION', 'POP_TOTAL', 'POP', 'pop_total', 'POPULATION_TOTAL'],
  population_femmes:['POP_FEM', 'POP_F', 'POP_FEMMES', 'pop_fem'],
  population_hommes:['POP_HOM', 'POP_M', 'POP_H', 'POP_HOMMES', 'pop_hom'],
  wilaya:           ['WILAYA', 'WILAYA_FR', 'NOM_WILAYA', 'wilaya'],
  moughataa:        ['MOUGHATAA', 'MOUGHATAA_FR', 'NOM_MOUGHATAA', 'moughataa'],
  commune:          ['COMMUNE', 'COMMUNE_FR', 'NOM_COMMUNE', 'commune'],
}

const POINTS_EAU_FIELDS = {
  code_localite: ['CODE_LOCALITE', 'code_loc', 'CODE_LOC'],
  nom:           ['NOM', 'NOM_OUVRAGE', 'NOM_FR', 'nom'],
  type:          ['TYPE_OUVRAGE', 'TYPE', 'NATURE', 'type', 'نوع'],
  wilaya:        ['WILAYA', 'WILAYA_FR', 'NOM_WILAYA', 'wilaya'],
  moughataa:     ['MOUGHATAA', 'MOUGHATAA_FR', 'NOM_MOUGHATAA', 'moughataa'],
  commune:       ['COMMUNE', 'COMMUNE_FR', 'NOM_COMMUNE', 'commune'],
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

async function fetchJson(url, label = url) {
  process.stdout.write(`  → ${label}\n`)
  const r = await fetch(url, { headers: { 'User-Agent': 'MINAI-ansade-fetch/1.0' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`)
  return r.json()
}

/** Trouve la première valeur non vide parmi les noms de champs candidats */
function pickField(props, candidates) {
  for (const c of candidates) {
    if (props[c] != null && props[c] !== '') return props[c]
    // tente aussi en lowercase
    const lc = c.toLowerCase()
    if (props[lc] != null && props[lc] !== '') return props[lc]
  }
  return null
}

/** Mappe un Feature ArcGIS au schéma MINAI demandé */
function mapFeature(feature, fieldsMap) {
  const props = feature.properties || feature.attributes || {}
  const cleaned = {}
  for (const [target, candidates] of Object.entries(fieldsMap)) {
    const value = pickField(props, candidates)
    if (value != null) cleaned[target] = value
  }
  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: cleaned,
  }
}

/** Pagine la couche ArcGIS et récupère TOUTES les features en GeoJSON */
async function fetchAllFeatures(serviceUrl, label) {
  console.log(`\n📡  Pagination ${label}…`)
  console.log(`    ${serviceUrl}`)
  const all = []
  let offset = 0
  while (true) {
    const url = new URL(`${serviceUrl}/query`)
    url.searchParams.set('where', '1=1')
    url.searchParams.set('outFields', '*')
    url.searchParams.set('outSR', '4326')
    url.searchParams.set('f', 'geojson')
    url.searchParams.set('resultRecordCount', String(PAGE_SIZE))
    url.searchParams.set('resultOffset', String(offset))
    const data = await fetchJson(url.toString(), `page offset=${offset}`)
    const features = data.features || []
    all.push(...features)
    process.stdout.write(`    ✔︎ ${all.length} features cumulées\n`)
    if (features.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    if (offset > 200_000) {
      console.warn('    ⚠︎  Plus de 200k features, on coupe par sécurité')
      break
    }
  }
  return all
}

/** Construit la table de correspondance types arabes → français */
function buildTypeMapping(pointsEauFeatures) {
  const seen = new Set()
  const mapping = {}
  for (const f of pointsEauFeatures) {
    const t = f.properties?.type
    if (!t || seen.has(t)) continue
    seen.add(t)
    mapping[t] = guessFrench(t)
  }
  return mapping
}

/** Devine la traduction française d'un type arabe (heuristique simple) */
function guessFrench(arabicOrFrench) {
  const s = String(arabicOrFrench).toLowerCase().trim()
  // Quelques mappings connus
  if (s.includes('حفر') || s.includes('forage') || s.includes('sondage') || s.includes('صونداج')) return 'Forage'
  if (s.includes('بئر') || s.includes('puit') || s.includes('puits')) return 'Puits'
  if (s.includes('robinet') || s.includes('tap') || s.includes('صنبور')) return 'Robinet'
  if (s.includes('source') || s.includes('spring') || s.includes('عين')) return 'Source'
  if (s.includes('citerne') || s.includes('reservoir') || s.includes('خزان')) return 'Citerne'
  if (s.includes('fontaine') || s.includes('borne') || s.includes('fountain')) return 'Fontaine / Borne-fontaine'
  // Fallback : on garde la valeur d'origine
  return arabicOrFrench
}

/**
 * Walk récursif sur n'importe quel objet JSON pour trouver toutes les URLs
 * qui contiennent FeatureServer ou MapServer. Renvoie aussi le "path" dans
 * le JSON pour aider à identifier de quoi il s'agit (village/eau/etc).
 */
function findArcGISUrls(obj, path = '$', acc = []) {
  if (!obj) return acc
  if (typeof obj === 'string') {
    if (/FeatureServer|MapServer/i.test(obj) && /^https?:\/\//i.test(obj)) {
      acc.push({ path, url: obj })
    }
    return acc
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findArcGISUrls(v, `${path}[${i}]`, acc))
    return acc
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      findArcGISUrls(v, `${path}.${k}`, acc)
    }
  }
  return acc
}

/** Récupère les métadonnées d'un service (nom, description) pour mieux identifier */
async function fetchServiceInfo(serviceUrl) {
  try {
    const url = serviceUrl.replace(/\/\d+\/?$/, '') + '?f=json' // root du service
    const data = await fetchJson(url, 'metadata service')
    return {
      name: data.name || data.serviceDescription || 'sans nom',
      description: data.description || '',
      layers: data.layers || [],
    }
  } catch {
    return null
  }
}

/** Découvre les FeatureServers depuis le config JSON de l'Experience */
async function discoverEndpoints() {
  console.log(`\n🔎  Découverte de l'Experience ${EXPERIENCE_ID}…`)
  let config
  try {
    config = await fetchJson(ARCGIS_ITEM_API, 'config Experience')
  } catch (e) {
    console.error(`❌  Impossible de récupérer le config : ${e.message}`)
    console.error(`    Soit l'Experience n'est pas publique, soit l'API a changé.`)
    console.error(`    Solution : passe les URLs en env vars (voir en-tête du fichier).`)
    return null
  }

  // Mode debug : sauvegarde le config brut pour inspection manuelle
  if (process.env.DEBUG_CONFIG === '1') {
    const debugPath = resolve(OUTPUT_DIR, 'ansade-experience-config.json')
    await mkdir(OUTPUT_DIR, { recursive: true })
    await writeFile(debugPath, JSON.stringify(config, null, 2), 'utf-8')
    console.log(`    💾  Config brut écrit pour debug → ${debugPath}`)
  }

  // Walk récursif pour trouver toutes les URLs FeatureServer/MapServer
  const allUrls = findArcGISUrls(config)
  // Dédoublonner en gardant le 1er path trouvé
  const seen = new Set()
  const unique = []
  for (const item of allUrls) {
    if (seen.has(item.url)) continue
    seen.add(item.url)
    unique.push(item)
  }

  if (unique.length === 0) {
    console.warn(`    ⚠︎  0 URL FeatureServer trouvée dans le config.`)
    console.warn(`    Le config a quand même été récupéré (clés racine : ${Object.keys(config).slice(0, 10).join(', ')}).`)
    console.warn(`    Probable : ArcGIS Experience charge ses datasources lazy (au runtime).`)
    return null
  }

  console.log(`    Trouvé ${unique.length} URLs ArcGIS uniques dans le config :`)
  unique.forEach((it, i) => {
    console.log(`    ${String(i + 1).padStart(2)}. ${it.url}`)
    console.log(`        path: ${it.path}`)
  })

  // Convertit au format attendu en aval (label = dernier segment du path utile)
  return unique.map((it, i) => ({
    id: `auto_${i}`,
    label: it.path,
    url: it.url,
  }))
}

/** Cherche le datasource qui matche un set de mots-clés */
function findEndpoint(datasources, keywords) {
  for (const ds of datasources) {
    const haystack = `${ds.label} ${ds.url}`.toLowerCase()
    if (keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return ds.url
    }
  }
  return null
}

/** Sauvegarde un GeoJSON en pretty-print */
async function saveGeoJSON(filename, features) {
  const fc = { type: 'FeatureCollection', features }
  const path = resolve(OUTPUT_DIR, filename)
  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(path, JSON.stringify(fc, null, 2), 'utf-8')
  console.log(`✅  ${features.length.toLocaleString('fr-FR')} features → ${path}`)
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🇲🇷  MINAI — extraction ANSADE (RGPH-5)')
  console.log('─────────────────────────────────────────')

  // 1. URLs : variables d'env > découverte automatique
  let villagesUrl  = process.env.ANSADE_VILLAGES_URL
  let pointsEauUrl = process.env.ANSADE_POINTS_EAU_URL

  if (!villagesUrl || !pointsEauUrl) {
    const datasources = await discoverEndpoints()
    if (datasources) {
      villagesUrl  = villagesUrl  || findEndpoint(datasources, KEYWORDS_VILLAGES)
      pointsEauUrl = pointsEauUrl || findEndpoint(datasources, KEYWORDS_POINTS_EAU)
    }
  }

  if (!villagesUrl || !pointsEauUrl) {
    console.error('\n❌  Impossible d\'identifier les FeatureServers automatiquement.')
    console.error('    Trouve-les manuellement dans le dashboard :')
    console.error('    1. Ouvre https://experience.arcgis.com/experience/' + EXPERIENCE_ID)
    console.error('    2. F12 → Network → filtre "FeatureServer"')
    console.error('    3. Recharge la page, note les URLs')
    console.error('    4. Relance :')
    console.error('       ANSADE_VILLAGES_URL="https://..." ANSADE_POINTS_EAU_URL="https://..." npm run fetch:ansade')
    process.exit(1)
  }

  // 2. Fetch
  const villagesRaw = await fetchAllFeatures(villagesUrl, 'villages')
  const pointsEauRaw = await fetchAllFeatures(pointsEauUrl, "points d'eau")

  // 3. Mapping vers schéma MINAI
  console.log('\n🧹  Nettoyage et mapping des champs…')
  const villages   = villagesRaw.map((f) => mapFeature(f, VILLAGE_FIELDS))
  const pointsEau  = pointsEauRaw.map((f) => mapFeature(f, POINTS_EAU_FIELDS))

  // 4. Mapping types arabes → français
  const typeMapping = buildTypeMapping(pointsEau)
  console.log(`    ${Object.keys(typeMapping).length} types distincts détectés`)

  // 5. Save
  console.log('\n💾  Écriture des fichiers…')
  await saveGeoJSON('villages.geojson', villages)
  await saveGeoJSON('points_eau.geojson', pointsEau)
  const mappingPath = resolve(OUTPUT_DIR, 'mapping_types.json')
  await writeFile(mappingPath, JSON.stringify(typeMapping, null, 2), 'utf-8')
  console.log(`✅  ${Object.keys(typeMapping).length} types → ${mappingPath}`)

  // 6. Récap
  const totalPop = villages.reduce((s, v) => s + (Number(v.properties.population_total) || 0), 0)
  console.log('\n📊  Récap')
  console.log(`    Villages         : ${villages.length.toLocaleString('fr-FR')}`)
  console.log(`    Points d'eau     : ${pointsEau.length.toLocaleString('fr-FR')}`)
  console.log(`    Population totale: ${totalPop.toLocaleString('fr-FR')}`)
  console.log('\n✨  Terminé. Les fichiers sont dans public/data/.')
}

main().catch((e) => {
  console.error('\n💥  Erreur fatale :', e)
  process.exit(1)
})
