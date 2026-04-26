// Données démo des 13 wilayas de Mauritanie
// Scores 0-100 où 100 = excellent accès à l'eau potable
// Ces chiffres sont des estimations pour la démo — à remplacer par les vrais
// scores calculés depuis les données WPDx + populations rurales.

export interface Region {
  id: string
  name: string
  capital: string
  center: [number, number] // [lng, lat]
  waterAccessScore: number
  population: number
  ruralPopulation: number
  avgDistanceToWater: number // km moyen pour accéder à un point d'eau
  priorityVillages: number   // nombre de villages identifiés comme prioritaires
}

export const MAURITANIA_REGIONS: Region[] = [
  { id: 'NKC', name: 'Nouakchott',          capital: 'Nouakchott',  center: [-15.97, 18.08], waterAccessScore: 78, population: 1195000, ruralPopulation:   45000, avgDistanceToWater: 0.4, priorityVillages:  2 },
  { id: 'DAK', name: 'Dakhlet Nouadhibou',  capital: 'Nouadhibou',  center: [-17.04, 20.93], waterAccessScore: 71, population:  155000, ruralPopulation:   28000, avgDistanceToWater: 1.2, priorityVillages:  4 },
  { id: 'INC', name: 'Inchiri',             capital: 'Akjoujt',     center: [-12.36, 19.74], waterAccessScore: 52, population:   23000, ruralPopulation:   14000, avgDistanceToWater: 3.8, priorityVillages:  6 },
  { id: 'TIR', name: 'Tiris Zemmour',       capital: 'Zouerate',    center: [-12.71, 22.74], waterAccessScore: 48, population:   58000, ruralPopulation:   18000, avgDistanceToWater: 4.5, priorityVillages:  8 },
  { id: 'ADR', name: 'Adrar',               capital: 'Atar',        center: [-13.05, 20.51], waterAccessScore: 41, population:   80000, ruralPopulation:   42000, avgDistanceToWater: 5.6, priorityVillages: 14 },
  { id: 'TAG', name: 'Tagant',              capital: 'Tidjikja',    center: [-11.43, 18.55], waterAccessScore: 33, population:   90000, ruralPopulation:   58000, avgDistanceToWater: 6.8, priorityVillages: 19 },
  { id: 'HCH', name: 'Hodh Ech Chargui',    capital: 'Néma',        center:  [-7.26, 16.62], waterAccessScore: 28, population:  470000, ruralPopulation:  330000, avgDistanceToWater: 7.4, priorityVillages: 42 },
  { id: 'HEG', name: 'Hodh El Gharbi',      capital: 'Aïoun',       center:  [-9.61, 16.66], waterAccessScore: 31, population:  330000, ruralPopulation:  225000, avgDistanceToWater: 6.9, priorityVillages: 35 },
  { id: 'ASS', name: 'Assaba',              capital: 'Kiffa',       center: [-11.40, 16.62], waterAccessScore: 38, population:  430000, ruralPopulation:  290000, avgDistanceToWater: 5.2, priorityVillages: 28 },
  { id: 'GOR', name: 'Gorgol',              capital: 'Kaédi',       center: [-13.51, 16.15], waterAccessScore: 56, population:  370000, ruralPopulation:  240000, avgDistanceToWater: 2.8, priorityVillages: 12 },
  { id: 'BRA', name: 'Brakna',              capital: 'Aleg',        center: [-13.91, 17.05], waterAccessScore: 49, population:  340000, ruralPopulation:  220000, avgDistanceToWater: 3.6, priorityVillages: 17 },
  { id: 'TRA', name: 'Trarza',              capital: 'Rosso',       center: [-15.81, 16.51], waterAccessScore: 64, population:  310000, ruralPopulation:  180000, avgDistanceToWater: 1.9, priorityVillages:  9 },
  { id: 'GUI', name: 'Guidimakha',          capital: 'Sélibaby',    center: [-12.18, 15.16], waterAccessScore: 44, population:  330000, ruralPopulation:  240000, avgDistanceToWater: 4.1, priorityVillages: 22 },
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
