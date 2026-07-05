/**
 * MINAI · Loaders géospatiaux depuis Supabase (PostGIS)
 * =====================================================
 *
 * Trois fonctions qui interrogent les vues Supabase et retournent le
 * même format que les loaders 'legacy' basés sur les fichiers geojson
 * statiques. Ça permet une bascule sans changer les composants React.
 *
 * Activation via le feature flag VITE_USE_SUPABASE_GEODATA=true dans
 * le .env. Par défaut le frontend continue à lire les fichiers
 * statiques dans public/data/ — zero impact tant que le flag n'est
 * pas activé.
 *
 * Les vues Supabase (villages_geojson, water_points_geojson,
 * wilayas_geojson) doivent avoir été créées via supabase/geodata_views.sql.
 */
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import { supabase } from './supabase'
import {
  statusColor,
  statusLabel,
  type VillageEval,
  type VillageStatus,
} from './villages'

/** Détermine si la source Supabase est activée pour les données géo. */
export const USE_SUPABASE_GEODATA =
  import.meta.env.VITE_USE_SUPABASE_GEODATA === 'true'

// ─── Types renvoyés par les vues Supabase ────────────────────────────

/**
 * Un `geom` PostGIS converti par ST_AsGeoJSON. Suivant le mode Supabase,
 * on peut recevoir soit un objet GeoJSON, soit une chaîne JSON à parser.
 */
type GeomRaw =
  | { type: string; coordinates: unknown }
  | string
  | null
  | undefined

function parseGeom(g: GeomRaw): GeoJSON.Geometry | null {
  if (!g) return null
  if (typeof g === 'string') {
    try {
      return JSON.parse(g) as GeoJSON.Geometry
    } catch {
      return null
    }
  }
  return g as GeoJSON.Geometry
}

interface VillageRow {
  code_localite: number
  name_fr: string
  name_ar: string | null
  wilaya: string | null
  wilaya_id: string | null
  moughataa: string | null
  moughataa_ar: string | null
  commune: string | null
  commune_ar: string | null
  population_total: number
  population_femmes: number | null
  population_hommes: number | null
  reseau_aep: boolean | null
  electricite: string | null
  distance_to_water_km: number | null
  nearest_water_lng: number | null
  nearest_water_lat: number | null
  nearest_water_type: string | null
  status: VillageStatus | null
  priority_score: number | null
  is_top_priority: boolean | null
  is_success_story: boolean | null
  geom: GeomRaw
}

interface WaterPointRow {
  code_localite: number | null
  name: string | null
  type: string | null
  kind: string | null
  source: string
  categorie: string | null
  wilaya: string | null
  moughataa: string | null
  commune: string | null
  drinkable: string | null
  operational_status: string | null
  geom: GeomRaw
}

interface WilayaRow {
  id: string
  name: string
  shape_name: string | null
  population: number | null
  capital: string | null
  geom: GeomRaw
}

// ─── Récupération paginée ────────────────────────────────────────────
// Supabase limite les SELECT à 1000 lignes par défaut. On pagine
// pour récupérer les 8 447 villages / ~7 000 water_points.

async function fetchAllRows<T>(
  tableOrView: string,
  columns: string,
  batchSize = 1000,
): Promise<T[]> {
  if (!supabase) throw new Error('Supabase non configuré')

  const all: T[] = []
  let from = 0
  while (true) {
    const to = from + batchSize - 1
    const { data, error } = await supabase
      .from(tableOrView)
      .select(columns)
      .range(from, to)
    if (error) throw new Error(`Erreur lecture ${tableOrView} : ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...(data as unknown as T[]))
    if (data.length < batchSize) break
    from += batchSize
  }
  return all
}

// ─── Résolution wilayaId → identique à ansade-villages.ts ────────────

function normName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+(ech|el)\s+/g, ' ')
    .replace(/[^a-z]/g, '')
}

function resolveWilayaId(ansadeWilaya: string | null): string | null {
  if (!ansadeWilaya) return null
  const target = normName(ansadeWilaya)
  if (target.includes('nouakchott')) return 'NKC'
  const exact = MAURITANIA_REGIONS.find((r) => normName(r.name) === target)
  if (exact) return exact.id
  const partial = MAURITANIA_REGIONS.find(
    (r) => target.includes(normName(r.name)) || normName(r.name).includes(target),
  )
  return partial?.id ?? null
}

// ─── Villages ────────────────────────────────────────────────────────

const VILLAGE_COLUMNS = [
  'code_localite',
  'name_fr',
  'name_ar',
  'wilaya',
  'wilaya_id',
  'moughataa',
  'moughataa_ar',
  'commune',
  'commune_ar',
  'population_total',
  'population_femmes',
  'population_hommes',
  'reseau_aep',
  'electricite',
  'distance_to_water_km',
  'nearest_water_lng',
  'nearest_water_lat',
  'nearest_water_type',
  'status',
  'priority_score',
  'is_top_priority',
  'is_success_story',
  'geom',
].join(',')

/**
 * Charge tous les villages depuis Supabase et retourne le même format
 * que loadAnsadeVillages() (utilisée dans App.tsx).
 */
export async function loadVillagesFromSupabase(): Promise<{
  villages: VillageEval[]
  geojson: GeoJSON.FeatureCollection
}> {
  const rows = await fetchAllRows<VillageRow>(
    'villages_geojson',
    VILLAGE_COLUMNS,
  )

  const villages: VillageEval[] = []
  const features: GeoJSON.Feature[] = []

  for (const r of rows) {
    const geom = parseGeom(r.geom)
    if (!geom || geom.type !== 'Point') continue

    const wilayaId = r.wilaya_id ?? resolveWilayaId(r.wilaya) ?? ''
    if (!wilayaId) continue

    const coords = (geom as GeoJSON.Point).coordinates as [number, number]
    const village: Village = {
      id: String(r.code_localite),
      name: r.name_fr,
      wilayaId,
      center: coords,
      population: Number(r.population_total) || 0,
    }

    const status: VillageStatus = (r.status ?? 'ok') as VillageStatus
    const distanceToWaterKm = Number(r.distance_to_water_km) || 0
    const priorityScore = Number(r.priority_score) || 0
    const nearestWaterPoint: [number, number] | null =
      r.nearest_water_lng != null && r.nearest_water_lat != null
        ? [Number(r.nearest_water_lng), Number(r.nearest_water_lat)]
        : null

    villages.push({
      village,
      status,
      distanceToWaterKm,
      priorityScore,
      nearestWaterPoint,
    })

    features.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        code_localite: r.code_localite,
        nom_fr: r.name_fr,
        nom_ar: r.name_ar,
        wilaya: r.wilaya,
        wilaya_ar: null,
        moughataa: r.moughataa,
        moughataa_ar: r.moughataa_ar,
        commune: r.commune,
        commune_ar: r.commune_ar,
        population_total: r.population_total,
        population_femmes: r.population_femmes,
        population_hommes: r.population_hommes,
        reseau_aep: r.reseau_aep ? 'Oui' : 'Non',
        electricite: r.electricite,
        distance_to_water_km: distanceToWaterKm,
        nearest_water_lng: r.nearest_water_lng,
        nearest_water_lat: r.nearest_water_lat,
        nearest_water_type: r.nearest_water_type,
        status,
        priority_score: priorityScore,
        is_top_priority: r.is_top_priority ? 1 : 0,
        is_success_story: r.is_success_story ? 1 : 0,
        wilayaId,
        color: statusColor(status),
        statusLabel: statusLabel(status),
      },
    })
  }

  return {
    villages,
    geojson: { type: 'FeatureCollection', features },
  }
}

// ─── Water points ────────────────────────────────────────────────────

const WATER_POINT_COLUMNS = [
  'code_localite',
  'name',
  'type',
  'kind',
  'source',
  'categorie',
  'wilaya',
  'moughataa',
  'commune',
  'drinkable',
  'operational_status',
  'geom',
].join(',')

/**
 * Charge les points d'eau depuis Supabase et retourne une
 * FeatureCollection au format compatible MapView.
 */
export async function loadWaterPointsFromSupabase(
  sources: Array<'ANSADE' | 'OSM' | 'WPDx' | 'manual'> = ['OSM'],
): Promise<GeoJSON.FeatureCollection> {
  if (!supabase) throw new Error('Supabase non configuré')

  // On filtre par source (par défaut OSM pour matcher water-points.geojson).
  const all: WaterPointRow[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const to = from + batchSize - 1
    const { data, error } = await supabase
      .from('water_points_geojson')
      .select(WATER_POINT_COLUMNS)
      .in('source', sources)
      .range(from, to)
    if (error) throw new Error(`Erreur lecture water_points : ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...(data as unknown as WaterPointRow[]))
    if (data.length < batchSize) break
    from += batchSize
  }

  const features: GeoJSON.Feature[] = []
  for (const r of all) {
    const geom = parseGeom(r.geom)
    if (!geom || geom.type !== 'Point') continue
    features.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        code_localite: r.code_localite,
        name: r.name,
        type: r.type,
        kind: r.kind ?? 'other',
        source: r.source,
        categorie: r.categorie,
        wilaya: r.wilaya,
        moughataa: r.moughataa,
        commune: r.commune,
        drinkable: r.drinkable,
        status: r.operational_status,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

// ─── Priorities (fichier léger, 54 pins TOP-30 + success stories) ──

/**
 * Charge uniquement les 54 villages prioritaires (TOP-30 critiques +
 * 24 success stories) depuis Supabase. Équivalent Supabase du fichier
 * public/data/villages-priorities.geojson.
 *
 * Format de sortie : FeatureCollection avec propriétés enrichies
 * (wilayaId, nom_fr, is_top_priority, is_success_story) — compatible
 * avec les couches Mapbox `priority-halo`, `village-top`, `village-success`.
 */
export async function loadPrioritiesFromSupabase(): Promise<GeoJSON.FeatureCollection> {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase
    .from('villages_geojson')
    .select(VILLAGE_COLUMNS)
    .or('is_top_priority.eq.true,is_success_story.eq.true')
    .limit(200) // 30 + 24 = 54 en pratique, marge large

  if (error) throw new Error(`Erreur lecture priorities : ${error.message}`)

  const features: GeoJSON.Feature[] = []
  for (const row of (data ?? []) as unknown as VillageRow[]) {
    const geom = parseGeom(row.geom)
    if (!geom || geom.type !== 'Point') continue

    const wilayaId = row.wilaya_id ?? resolveWilayaId(row.wilaya) ?? ''
    const status = (row.status ?? 'ok') as VillageStatus

    features.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        code_localite: row.code_localite,
        nom_fr: row.name_fr,
        nom_ar: row.name_ar,
        wilaya: row.wilaya,
        wilayaId,
        moughataa: row.moughataa,
        commune: row.commune,
        population_total: row.population_total,
        reseau_aep: row.reseau_aep ? 'Oui' : 'Non',
        distance_to_water_km: row.distance_to_water_km,
        nearest_water_lng: row.nearest_water_lng,
        nearest_water_lat: row.nearest_water_lat,
        nearest_water_type: row.nearest_water_type,
        status,
        priority_score: row.priority_score,
        is_top_priority: row.is_top_priority ? 1 : 0,
        is_success_story: row.is_success_story ? 1 : 0,
        color: statusColor(status),
        statusLabel: statusLabel(status),
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

// ─── Wilayas ─────────────────────────────────────────────────────────

const WILAYA_COLUMNS = ['id', 'name', 'shape_name', 'population', 'capital', 'geom'].join(',')

/**
 * Charge les polygones des wilayas depuis Supabase.
 */
export async function loadWilayasFromSupabase(): Promise<GeoJSON.FeatureCollection> {
  const rows = await fetchAllRows<WilayaRow>(
    'wilayas_geojson',
    WILAYA_COLUMNS,
    100,
  )

  const features: GeoJSON.Feature[] = []
  for (const r of rows) {
    const geom = parseGeom(r.geom)
    if (!geom) continue
    features.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        regionId: r.id,
        regionName: r.name,
        shapeName: r.shape_name,
        name: r.name,
        population: r.population,
        capital: r.capital,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
