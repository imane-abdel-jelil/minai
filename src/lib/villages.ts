/**
 * Évaluation village-niveau pour MINAI.
 *
 * Pour chaque village, on calcule :
 *   - distance (km) au point d'eau OSM le plus proche
 *   - statut d'accès : critical | risk | ok
 *   - score de priorité (pour classement)
 *
 * Les seuils suivent la doctrine humanitaire courante :
 *   - distance > 5 km : critique (Sphere recommande < 500 m, mais en
 *     contexte rural sahélien la cible opérationnelle est plus large)
 *   - distance > 2 km : à risque
 *   - sinon : ok
 *
 * Le score de priorité est : distance × population × multiplicateur
 *   (1.5 pour critical, 1 pour risk, 0.3 pour ok)
 */

import type { Village } from '../data/mauritania-villages'

export type VillageStatus = 'critical' | 'risk' | 'ok'

export interface VillageEval {
  village: Village
  /** Distance (km) au point d'eau OSM le plus proche */
  distanceToWaterKm: number
  status: VillageStatus
  /** Score de priorité — plus c'est haut, plus c'est urgent */
  priorityScore: number
  /** Coordonnées du point d'eau le plus proche, ou null si aucune donnée */
  nearestWaterPoint: [number, number] | null
}

const STATUS_COLORS: Record<VillageStatus, string> = {
  critical: '#ef4444',
  risk:     '#f97316',
  ok:       '#22c55e',
}
const STATUS_LABELS: Record<VillageStatus, string> = {
  critical: 'Critique',
  risk:     'Risque',
  ok:       'OK',
}

export function statusColor(s: VillageStatus): string {
  return STATUS_COLORS[s]
}
export function statusLabel(s: VillageStatus): string {
  return STATUS_LABELS[s]
}

// ─── Distance haversine (km) ─────────────────────────────────────────
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371 // rayon Terre en km
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// ─── Évaluation d'un village ─────────────────────────────────────────
function statusFromDistance(distKm: number): VillageStatus {
  if (distKm > 5) return 'critical'
  if (distKm > 2) return 'risk'
  return 'ok'
}

function priorityFromStatus(status: VillageStatus): number {
  if (status === 'critical') return 1.5
  if (status === 'risk') return 1
  return 0.3
}

export function evaluateVillage(
  village: Village,
  waterPoints: GeoJSON.FeatureCollection | null
): VillageEval {
  if (!waterPoints || waterPoints.features.length === 0) {
    return {
      village,
      distanceToWaterKm: Infinity,
      status: 'critical',
      priorityScore: village.population * 1.5,
      nearestWaterPoint: null,
    }
  }

  let minDist = Infinity
  let nearest: [number, number] | null = null

  for (const f of waterPoints.features) {
    if (!f.geometry || f.geometry.type !== 'Point') continue
    const coords = f.geometry.coordinates as [number, number]
    const d = haversineKm(village.center, coords)
    if (d < minDist) {
      minDist = d
      nearest = coords
    }
  }

  const status = statusFromDistance(minDist)
  const priorityScore = minDist * village.population * priorityFromStatus(status)

  return {
    village,
    distanceToWaterKm: minDist,
    status,
    priorityScore,
    nearestWaterPoint: nearest,
  }
}

export function evaluateAllVillages(
  villages: Village[],
  waterPoints: GeoJSON.FeatureCollection | null
): VillageEval[] {
  return villages.map((v) => evaluateVillage(v, waterPoints))
}

// ─── Recommandation ──────────────────────────────────────────────────
/**
 * Renvoie les `n` villages classés par urgence décroissante.
 * Filtre exclut les 'ok' par défaut (on ne recommande pas un village
 * déjà bien desservi).
 */
export function topPriorities(
  evals: VillageEval[],
  n = 3,
  includeOk = false
): VillageEval[] {
  return evals
    .filter((e) => includeOk || e.status !== 'ok')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, n)
}

/**
 * Délai d'intervention recommandé en fonction du statut.
 */
export function recommendedDelay(status: VillageStatus): string {
  if (status === 'critical') return 'sous 48 h'
  if (status === 'risk') return 'sous 30 jours'
  return 'pas d’action urgente'
}
