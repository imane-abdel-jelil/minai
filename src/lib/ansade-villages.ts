/**
 * Loader pour les 8 447 villages ANSADE — SOURCE = Supabase PostGIS.
 *
 * Depuis le chantier 1 (migration PostGIS), les villages ne sont plus
 * chargés depuis public/data/villages-scored.geojson mais interrogés
 * directement dans Supabase via la vue `villages_geojson` (qui expose
 * la géométrie en GeoJSON via ST_AsGeoJSON).
 *
 * Fallback : si Supabase n'est pas configuré OU si la requête échoue,
 * on retombe sur le fichier statique. Ça garantit que le site continue
 * à marcher pendant toute la période de transition.
 *
 * Le format de sortie reste strictement identique à l'ancien —
 * l'ensemble du reste de l'app (MapView, Sidebar, etc.) est agnostique
 * de la source.
 */

import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import { supabase } from './supabase'
import { statusColor, statusLabel, type VillageEval, type VillageStatus } from './villages'

// ─── Mapping wilaya ANSADE → wilayaId MINAI ───────────────────────────────

function normName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+(ech|el)\s+/g, ' ')
    .replace(/[^a-z]/g, '')
}

/** Trouve le wilayaId MINAI à partir d'un nom ANSADE.
 *  Exporté pour réutilisation dans MapView (enrichissement des
 *  features du fichier priorities côté client). */
export function findWilayaId(ansadeWilaya: string | undefined | null): string | null {
  if (!ansadeWilaya) return null
  let target = normName(ansadeWilaya)
  // Corrections OCR : ANSADE écrit certains noms avec un 'l' minuscule
  // qui ressemble à un 'i' → typo systématique dans les données brutes.
  //   'lnchiri' → 'inchiri' (i minuscule → i majuscule normalisé)
  target = target.replace(/^lnchiri$/, 'inchiri')
  if (target.includes('nouakchott')) return 'NKC'
  const exact = MAURITANIA_REGIONS.find((r) => normName(r.name) === target)
  if (exact) return exact.id
  const partial = MAURITANIA_REGIONS.find(
    (r) => target.includes(normName(r.name)) || normName(r.name).includes(target),
  )
  return partial?.id ?? null
}

// ─── Conversion d'un Feature GeoJSON classique → VillageEval ─────────────
// (utilisé pour le path fallback fichier statique)

function featureToEval(feature: GeoJSON.Feature): VillageEval | null {
  if (!feature.geometry || feature.geometry.type !== 'Point') return null
  const coords = feature.geometry.coordinates as [number, number]
  const props = feature.properties || {}

  const wilayaId = findWilayaId(props.wilaya as string | null)
  if (!wilayaId) return null

  const village: Village = {
    id: String(props.code_localite ?? feature.id ?? ''),
    name: (props.nom_fr as string) || '(sans nom)',
    wilayaId,
    center: coords,
    population: Number(props.population_total) || 0,
  }

  const status = (props.status as VillageStatus) ?? 'ok'
  const distanceToWaterKm = Number(props.distance_to_water_km) || 0
  const priorityScore = Number(props.priority_score) || 0
  const nearestWaterPoint: [number, number] | null =
    props.nearest_water_lng != null && props.nearest_water_lat != null
      ? [Number(props.nearest_water_lng), Number(props.nearest_water_lat)]
      : null

  return { village, status, distanceToWaterKm, priorityScore, nearestWaterPoint }
}

// ─── Conversion d'une ligne DB (villages_geojson) → VillageEval + Feature ─

interface DbVillageRow {
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
  reseau_aep: boolean
  electricite: string | null
  geom: { type: string; coordinates: [number, number] }
  distance_to_water_km: number | null
  nearest_water_lng: number | null
  nearest_water_lat: number | null
  nearest_water_type: string | null
  status: VillageStatus | null
  priority_score: number | null
  is_top_priority: boolean
  is_success_story: boolean
}

function rowToEvalAndFeature(row: DbVillageRow): {
  ev: VillageEval
  feature: GeoJSON.Feature
} | null {
  if (!row.geom || row.geom.type !== 'Point') return null
  const coords = row.geom.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null

  const wilayaId = row.wilaya_id ?? findWilayaId(row.wilaya)
  if (!wilayaId) return null

  const village: Village = {
    id: String(row.code_localite),
    name: row.name_fr || '(sans nom)',
    wilayaId,
    center: [coords[0], coords[1]],
    population: row.population_total || 0,
  }

  const status: VillageStatus = row.status ?? 'ok'
  const ev: VillageEval = {
    village,
    status,
    distanceToWaterKm: row.distance_to_water_km ?? 0,
    priorityScore: row.priority_score ?? 0,
    nearestWaterPoint:
      row.nearest_water_lng != null && row.nearest_water_lat != null
        ? [Number(row.nearest_water_lng), Number(row.nearest_water_lat)]
        : null,
  }

  // On reconstruit une Feature GeoJSON compatible avec les couches
  // Mapbox existantes (mêmes noms de propriétés qu'avant).
  const feature: GeoJSON.Feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [coords[0], coords[1]],
    },
    properties: {
      code_localite: row.code_localite,
      nom_fr: row.name_fr,
      nom_ar: row.name_ar,
      wilaya: row.wilaya,
      wilaya_ar: null,
      moughataa: row.moughataa,
      moughataa_ar: row.moughataa_ar,
      commune: row.commune,
      commune_ar: row.commune_ar,
      population_total: row.population_total,
      population_femmes: row.population_femmes,
      population_hommes: row.population_hommes,
      reseau_aep: row.reseau_aep ? 'Oui' : 'Non',
      electricite: row.electricite,
      distance_to_water_km: row.distance_to_water_km,
      nearest_water_lng: row.nearest_water_lng,
      nearest_water_lat: row.nearest_water_lat,
      nearest_water_type: row.nearest_water_type,
      status: row.status,
      priority_score: row.priority_score,
      is_top_priority: row.is_top_priority ? 1 : 0,
      is_success_story: row.is_success_story ? 1 : 0,
      // Champs enrichis consommés par les Layers Mapbox
      wilayaId,
      color: statusColor(status),
      statusLabel: statusLabel(status),
    },
  }

  return { ev, feature }
}

// ─── Loader principal ─────────────────────────────────────────────────────

/**
 * Charge les 8 447 villages depuis Supabase (source de vérité).
 * Fallback sur le fichier statique si Supabase n'est pas dispo.
 */
export async function loadAnsadeVillages(): Promise<{
  villages: VillageEval[]
  geojson: GeoJSON.FeatureCollection
}> {
  // ─── Path 1 : Supabase (source primaire) ─────────────────────────
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('villages_geojson')
        .select('*')
        .limit(20000)

      if (error) {
        console.warn(
          '[villages] Supabase indisponible, fallback fichier statique :',
          error.message,
        )
      } else if (data && data.length > 0) {
        const villages: VillageEval[] = []
        const features: GeoJSON.Feature[] = []
        for (const row of data as DbVillageRow[]) {
          const result = rowToEvalAndFeature(row)
          if (!result) continue
          villages.push(result.ev)
          features.push(result.feature)
        }
        console.log(`[villages] ${villages.length} villages chargés depuis Supabase`)
        return {
          villages,
          geojson: { type: 'FeatureCollection', features },
        }
      } else {
        console.warn('[villages] Supabase renvoie 0 lignes, fallback fichier statique.')
      }
    } catch (e) {
      console.warn('[villages] Exception Supabase, fallback fichier statique :', e)
    }
  }

  // ─── Path 2 : fichier statique (fallback) ────────────────────────
  const r = await fetch('/data/villages-scored.geojson')
  if (!r.ok) throw new Error(`HTTP ${r.status} sur villages-scored.geojson`)
  const geojson = (await r.json()) as GeoJSON.FeatureCollection

  const enrichedFeatures: GeoJSON.Feature[] = []
  const villages: VillageEval[] = []
  for (const f of geojson.features) {
    const ev = featureToEval(f)
    if (!ev) continue
    villages.push(ev)
    enrichedFeatures.push({
      ...f,
      properties: {
        ...f.properties,
        wilayaId: ev.village.wilayaId,
        color: statusColor(ev.status),
        statusLabel: statusLabel(ev.status),
        status: ev.status,
        priority_score: ev.priorityScore,
      },
    })
  }
  console.log(`[villages] ${villages.length} villages chargés depuis fichier statique`)
  return {
    villages,
    geojson: { ...geojson, features: enrichedFeatures },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Top N villages classés par priority_score décroissant */
export function topPrioritiesAnsade(villages: VillageEval[], n = 3): VillageEval[] {
  return [...villages]
    .filter((v) => v.status !== 'ok')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, n)
}
