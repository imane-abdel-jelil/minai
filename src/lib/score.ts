/**
 * Score d'accès à l'eau, calculé dynamiquement depuis les vraies données :
 *   - nombre de points d'eau OSM dans la wilaya (lib/geo)
 *   - population rurale (mauritania-regions)
 *
 * Méthodologie (assumée et documentée pour l'utilisateur) :
 * On utilise le standard humanitaire Sphere comme référence : 1 point d'eau
 * pour 500 personnes en contexte stable. Exprimé en densité, ça donne
 * 2 points pour 1000 habitants ruraux. Le score est linéaire jusqu'à cette
 * cible puis capé à 100.
 *
 * Limites connues (à signaler dans l'UI) :
 *   - OSM = couverture cartographique, pas couverture réelle. Une wilaya
 *     peu mappée apparaîtra plus rouge que la réalité.
 *   - On n'utilise pas encore la distance moyenne ni le statut fonctionnel
 *     (en panne / actif). WPDx apportera ça.
 */
import type { Region } from '../data/mauritania-regions'
import { getScoreColor, getScoreLabel, MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { WilayaStats } from './geo'

/** Cible Sphere convertie en points par 1000 habitants. */
export const TARGET_DENSITY_PER_1000 = 2

export interface ComputedScore {
  /** Nombre de points d'eau OSM dans la wilaya */
  points: number
  /** Habitants ruraux par point d'eau (null si aucun point) */
  peoplePerPoint: number | null
  /** Densité = points pour 1000 habitants ruraux */
  density: number
  /** Score 0–100 dérivé de la densité vs la cible Sphere */
  score: number
  /** Couleur (cohérente avec getScoreColor) */
  color: string
  /** Étiquette catégorielle (Critique / Préoccupant / Acceptable / Bon) */
  label: string
  /** True si la valeur vient des stats live, false si c'est le fallback statique */
  fromData: boolean
}

function makeScoreFromDensity(
  points: number,
  ruralPop: number,
  fromData: boolean
): ComputedScore {
  const density = ruralPop > 0 ? (points / ruralPop) * 1000 : 0
  const score = Math.max(
    0,
    Math.min(100, Math.round((density / TARGET_DENSITY_PER_1000) * 100))
  )
  return {
    points,
    peoplePerPoint: points > 0 ? Math.round(ruralPop / points) : null,
    density,
    score,
    color: getScoreColor(score),
    label: getScoreLabel(score),
    fromData,
  }
}

/** Fallback statique tant que les stats live ne sont pas calculées (évite un flash rouge). */
function fallbackScore(r: Region): ComputedScore {
  return {
    points: 0,
    peoplePerPoint: null,
    density: 0,
    score: r.waterAccessScore,
    color: getScoreColor(r.waterAccessScore),
    label: getScoreLabel(r.waterAccessScore),
    fromData: false,
  }
}

export function computeAllScores(
  stats: Record<string, WilayaStats>
): Record<string, ComputedScore> {
  const hasLiveData = Object.keys(stats).length > 0
  const out: Record<string, ComputedScore> = {}
  for (const r of MAURITANIA_REGIONS) {
    const s = stats[r.id]
    if (hasLiveData && s) {
      out[r.id] = makeScoreFromDensity(s.total, r.ruralPopulation, true)
    } else {
      out[r.id] = fallbackScore(r)
    }
  }
  return out
}

/** Moyenne nationale pondérée par la population rurale (plus juste qu'une moyenne arithmétique). */
export function computeNationalScore(
  scores: Record<string, ComputedScore>
): number {
  let totalPop = 0
  let weighted = 0
  for (const r of MAURITANIA_REGIONS) {
    const s = scores[r.id]
    if (!s) continue
    totalPop += r.ruralPopulation
    weighted += s.score * r.ruralPopulation
  }
  return totalPop > 0 ? Math.round(weighted / totalPop) : 0
}
