/**
 * Loader pour les 8 447 villages ANSADE pré-calculés.
 *
 * Fichier source : public/data/villages-scored.geojson
 * (généré par scripts/compute-village-scores.mjs)
 *
 * Ce module remplace l'ancien array hardcodé MAURITANIA_VILLAGES par
 * un chargement asynchrone du recensement officiel ANSADE.
 *
 * Le format de sortie est volontairement compatible avec le type
 * `VillageEval` existant (lib/villages.ts) — pas besoin de toucher au
 * reste de l'app, on peut juste swap le tableau.
 */

import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import { statusColor, statusLabel, type VillageEval, type VillageStatus } from './villages'

// ─── Mapping wilaya ANSADE → wilayaId MINAI ───────────────────────────────
// ANSADE écrit les noms en français mais avec des variantes (sans accents,
// 'Hodh Chargui' vs 'Hodh Ech Chargui', découpage de Nouakchott…).
// On normalise pour matcher de façon robuste.

function normName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritical marks
    .replace(/\s+(ech|el)\s+/g, ' ')   // 'hodh ech chargui' → 'hodh chargui'
    .replace(/[^a-z]/g, '')
}

/** Trouve le wilayaId MINAI à partir d'un nom ANSADE.
 *  Exporté pour réutilisation dans MapView (enrichissement des
 *  features du fichier priorities côté client). */
export function findWilayaId(ansadeWilaya: string | undefined | null): string | null {
  if (!ansadeWilaya) return null
  const target = normName(ansadeWilaya)
  // Cas spécial Nouakchott : ANSADE découpe en 3 (Nord/Sud/Ouest), MINAI a un seul NKC
  if (target.includes('nouakchott')) return 'NKC'
  // Match exact normalisé
  const exact = MAURITANIA_REGIONS.find((r) => normName(r.name) === target)
  if (exact) return exact.id
  // Match par inclusion (gère les variantes)
  const partial = MAURITANIA_REGIONS.find(
    (r) => target.includes(normName(r.name)) || normName(r.name).includes(target)
  )
  return partial?.id ?? null
}

// ─── Conversion d'un Feature ANSADE en VillageEval ────────────────────────
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

  // Status & distance déjà pré-calculés par compute-village-scores.mjs
  const status = (props.status as VillageStatus) ?? 'ok'
  const distanceToWaterKm = Number(props.distance_to_water_km) || 0
  const priorityScore = Number(props.priority_score) || 0
  const nearestWaterPoint: [number, number] | null =
    props.nearest_water_lng != null && props.nearest_water_lat != null
      ? [Number(props.nearest_water_lng), Number(props.nearest_water_lat)]
      : null

  return { village, status, distanceToWaterKm, priorityScore, nearestWaterPoint }
}

// ─── Loader principal ─────────────────────────────────────────────────────
export async function loadAnsadeVillages(): Promise<{
  villages: VillageEval[]
  /** Le GeoJSON brut, utile pour Mapbox source */
  geojson: GeoJSON.FeatureCollection
}> {
  const r = await fetch('/data/villages-scored.geojson')
  if (!r.ok) throw new Error(`HTTP ${r.status} sur villages-scored.geojson`)
  const geojson = (await r.json()) as GeoJSON.FeatureCollection

  // Enrichit chaque feature avec wilayaId, color, statusLabel pour le rendu Mapbox
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
        // Champs supplémentaires consommés par MapView pour le rendu
        wilayaId: ev.village.wilayaId,
        color: statusColor(ev.status),
        statusLabel: statusLabel(ev.status),
        // Garantit la cohérence côté Mapbox
        status: ev.status,
        priority_score: ev.priorityScore,
      },
    })
  }

  return {
    villages,
    geojson: { ...geojson, features: enrichedFeatures },
  }
}

// ─── Helpers de filtrage / classement ─────────────────────────────────────

/** Top N villages classés par priority_score décroissant */
export function topPrioritiesAnsade(villages: VillageEval[], n = 3): VillageEval[] {
  return [...villages]
    .filter((v) => v.status !== 'ok')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, n)
}
