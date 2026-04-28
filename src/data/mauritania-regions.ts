/**
 * Données démographiques des 13 wilayas de Mauritanie.
 *
 * Source : Office National de la Statistique (ONS) — RGPH 2013
 *   Recensement Général de la Population et de l'Habitat 2013, résultats
 *   définitifs publiés en 2015. Population totale recensée : 3 537 368.
 *
 * Champs renseignés depuis l'ONS :
 *   - population         : population totale wilaya, RGPH 2013
 *   - ruralPopulation    : population vivant en milieu rural, calculée à
 *                          partir des taux d'urbanisation publiés au RGPH 2013
 *   - capital            : chef-lieu officiel
 *
 * À actualiser quand un fichier Excel ONS récent sera disponible :
 *   - projections 2024 (croissance démographique annuelle ~2,7%)
 *   - taux d'urbanisation actualisés (Nouakchott a fortement crû)
 *
 * Champs encore estimatifs (en attente de source officielle) :
 *   - avgDistanceToWater : distance moyenne au point d'eau (PNAEPA / VAM)
 *   - priorityVillages   : à calculer depuis OSM (villages > 2 km du
 *                          point d'eau le plus proche) ou depuis VAM/UNICEF
 *   - waterAccessScore   : déprécié, le score est maintenant calculé en live
 *                          depuis lib/score.ts (densité OSM / cible Sphere)
 */

export interface Region {
  id: string
  name: string
  capital: string
  center: [number, number] // [lng, lat]
  /** @deprecated Le score est calculé en live dans lib/score.ts.
   *  Ce champ ne sert plus que de fallback pendant le chargement initial. */
  waterAccessScore: number
  /** Population totale, RGPH 2013 (ONS) */
  population: number
  /** Population rurale, RGPH 2013 (calculée depuis le taux d'urbanisation) */
  ruralPopulation: number
  /** Distance moyenne au point d'eau en km — estimation, à remplacer */
  avgDistanceToWater: number
  /** Nombre de villages prioritaires — estimation, à remplacer */
  priorityVillages: number
}

// RGPH 2013 — Total national : 3 537 368
// Pour chaque wilaya : { population RGPH 2013 } × { taux rural RGPH 2013 }
//   ex. Hodh Ech Chargui : 430 668 × 0,75 ≈ 323 001 ruraux
export const MAURITANIA_REGIONS: Region[] = [
  // Wilayas urbaines / fortement urbanisées
  { id: 'NKC', name: 'Nouakchott',          capital: 'Nouakchott',  center: [-15.97, 18.08], waterAccessScore: 78, population: 958399, ruralPopulation:  28752, avgDistanceToWater: 0.4, priorityVillages:  2 },
  { id: 'DAK', name: 'Dakhlet Nouadhibou',  capital: 'Nouadhibou',  center: [-17.04, 20.93], waterAccessScore: 71, population: 123779, ruralPopulation:   6189, avgDistanceToWater: 1.2, priorityVillages:  4 },
  // Wilayas sahariennes peu peuplées
  { id: 'INC', name: 'Inchiri',             capital: 'Akjoujt',     center: [-12.36, 19.74], waterAccessScore: 52, population:  19639, ruralPopulation:   9820, avgDistanceToWater: 3.8, priorityVillages:  6 },
  { id: 'TIR', name: 'Tiris Zemmour',       capital: 'Zouerate',    center: [-12.71, 22.74], waterAccessScore: 48, population:  53261, ruralPopulation:  13315, avgDistanceToWater: 4.5, priorityVillages:  8 },
  { id: 'ADR', name: 'Adrar',               capital: 'Atar',        center: [-13.05, 20.51], waterAccessScore: 41, population:  62658, ruralPopulation:  31329, avgDistanceToWater: 5.6, priorityVillages: 14 },
  { id: 'TAG', name: 'Tagant',              capital: 'Tidjikja',    center: [-11.43, 18.55], waterAccessScore: 33, population:  80962, ruralPopulation:  56673, avgDistanceToWater: 6.8, priorityVillages: 19 },
  // Wilayas du sud-est (les plus peuplées rurales)
  { id: 'HCH', name: 'Hodh Ech Chargui',    capital: 'Néma',        center:  [-7.26, 16.62], waterAccessScore: 28, population: 430668, ruralPopulation: 323001, avgDistanceToWater: 7.4, priorityVillages: 42 },
  { id: 'HEG', name: 'Hodh El Gharbi',      capital: 'Aïoun',       center:  [-9.61, 16.66], waterAccessScore: 31, population: 294109, ruralPopulation: 205876, avgDistanceToWater: 6.9, priorityVillages: 35 },
  { id: 'ASS', name: 'Assaba',              capital: 'Kiffa',       center: [-11.40, 16.62], waterAccessScore: 38, population: 325897, ruralPopulation: 228128, avgDistanceToWater: 5.2, priorityVillages: 28 },
  // Vallée du fleuve Sénégal (sud agricole)
  { id: 'GOR', name: 'Gorgol',              capital: 'Kaédi',       center: [-13.51, 16.15], waterAccessScore: 56, population: 335917, ruralPopulation: 235142, avgDistanceToWater: 2.8, priorityVillages: 12 },
  { id: 'BRA', name: 'Brakna',              capital: 'Aleg',        center: [-13.91, 17.05], waterAccessScore: 49, population: 312277, ruralPopulation: 218594, avgDistanceToWater: 3.6, priorityVillages: 17 },
  { id: 'TRA', name: 'Trarza',              capital: 'Rosso',       center: [-15.81, 16.51], waterAccessScore: 64, population: 272773, ruralPopulation: 163664, avgDistanceToWater: 1.9, priorityVillages:  9 },
  { id: 'GUI', name: 'Guidimakha',          capital: 'Sélibaby',    center: [-12.18, 15.16], waterAccessScore: 44, population: 267029, ruralPopulation: 200272, avgDistanceToWater: 4.1, priorityVillages: 22 },
]

// Couleurs basées sur le score d'accès à l'eau
export const getScoreColor = (score: number): string => {
  if (score < 35) return '#ef4444' // rouge — critique
  if (score < 55) return '#f97316' // orange — préoccupant
  if (score < 75) return '#eab308' // jaune — acceptable
  return '#22c55e'                 // vert — bon
}

export const getScoreLabel = (score: number): string => {
  if (score < 35) return 'Critique'
  if (score < 55) return 'Préoccupant'
  if (score < 75) return 'Acceptable'
  return 'Bon'
}
