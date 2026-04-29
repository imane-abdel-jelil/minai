/**
 * Liste de villages et localités de Mauritanie utilisée par MINAI pour
 * le calcul du statut d'accès à l'eau au niveau village.
 *
 * Cette liste est curée à la main pour que la démo fonctionne dès le
 * premier paint. Pour étendre la couverture (centaines de villages
 * OSM), lancer `npm run fetch:villages` et remplacer cette constante
 * par le GeoJSON généré.
 *
 * Sources des coordonnées et populations :
 *   - OpenStreetMap (lieux place=town/village/hamlet)
 *   - Estimations basées sur les chiffres ANSADE et INSEE locaux
 *   - Cohérence vérifiée par croisement avec Wikipedia / GeoNames
 *
 * Les populations sont des ESTIMATIONS arrondies. Elles ne servent pas
 * à des chiffres officiels — uniquement à pondérer la priorisation des
 * convois (un village de 10 000 habitants à 5 km du point d'eau pèse
 * plus qu'un hameau de 500 habitants à la même distance).
 */

export interface Village {
  /** Identifiant interne court */
  id: string
  /** Nom du village/localité */
  name: string
  /** ID de la wilaya (matche MAURITANIA_REGIONS.id) */
  wilayaId: string
  /** [longitude, latitude] */
  center: [number, number]
  /** Population estimée (arrondie) */
  population: number
}

export const MAURITANIA_VILLAGES: Village[] = [
  // ─── Hodh Ech Chargui (sud-est, le plus rural) ─────────────────────
  { id: 'NEM',  name: 'Néma',         wilayaId: 'HCH', center: [ -7.26, 16.62], population: 30000 },
  { id: 'TIM',  name: 'Timbédra',     wilayaId: 'HCH', center: [ -8.17, 16.23], population: 20000 },
  { id: 'BSK',  name: 'Bassikounou',  wilayaId: 'HCH', center: [ -5.97, 15.83], population: 12000 },
  { id: 'WLT',  name: 'Walata',       wilayaId: 'HCH', center: [ -7.04, 17.30], population:  6000 },
  { id: 'DJG',  name: 'Djigueni',     wilayaId: 'HCH', center: [ -8.39, 15.74], population:  8000 },
  { id: 'ABG',  name: 'Adel Bagrou',  wilayaId: 'HCH', center: [ -7.72, 15.69], population:  9000 },

  // ─── Hodh El Gharbi ────────────────────────────────────────────────
  { id: 'AIO',  name: 'Aïoun',        wilayaId: 'HEG', center: [ -9.61, 16.66], population: 22000 },
  { id: 'TNT',  name: 'Tintane',      wilayaId: 'HEG', center: [-10.40, 16.42], population:  8000 },
  { id: 'KBN',  name: 'Kobeni',       wilayaId: 'HEG', center: [ -9.43, 15.92], population:  5000 },
  { id: 'TMC',  name: 'Tamchekett',   wilayaId: 'HEG', center: [-10.65, 17.20], population:  5000 },

  // ─── Assaba ────────────────────────────────────────────────────────
  { id: 'KIF',  name: 'Kiffa',        wilayaId: 'ASS', center: [-11.40, 16.62], population: 50000 },
  { id: 'GUE',  name: 'Guérou',       wilayaId: 'ASS', center: [-11.71, 16.82], population:  6000 },
  { id: 'KAN',  name: 'Kankossa',     wilayaId: 'ASS', center: [-11.51, 15.95], population:  8000 },
  { id: 'BMD',  name: 'Boumdeid',     wilayaId: 'ASS', center: [-11.76, 17.49], population:  4000 },

  // ─── Gorgol (vallée du Sénégal — sud agricole) ─────────────────────
  { id: 'KAE',  name: 'Kaédi',        wilayaId: 'GOR', center: [-13.51, 16.15], population: 55000 },
  { id: 'MGM',  name: 'Maghama',      wilayaId: 'GOR', center: [-12.85, 15.51], population: 14000 },
  { id: 'MBT',  name: 'M’bout',  wilayaId: 'GOR', center: [-12.59, 16.02], population:  9000 },
  { id: 'MNG',  name: 'Monguel',      wilayaId: 'GOR', center: [-13.18, 16.50], population:  4000 },

  // ─── Brakna ────────────────────────────────────────────────────────
  { id: 'ALG',  name: 'Aleg',         wilayaId: 'BRA', center: [-13.91, 17.05], population: 12000 },
  { id: 'BGH',  name: 'Boghé',        wilayaId: 'BRA', center: [-14.27, 16.59], population: 25000 },
  { id: 'BAB',  name: 'Bababé',       wilayaId: 'BRA', center: [-13.52, 16.40], population:  4000 },
  { id: 'MGL',  name: 'Maghta-Lahjar',wilayaId: 'BRA', center: [-13.05, 17.05], population:  9000 },
  { id: 'MBG',  name: 'M’bagne', wilayaId: 'BRA', center: [-13.79, 16.50], population:  4000 },

  // ─── Guidimakha (le plus pauvre — vallée du Sénégal) ───────────────
  { id: 'SEL',  name: 'Sélibaby',     wilayaId: 'GUI', center: [-12.18, 15.16], population: 17000 },
  { id: 'OYG',  name: 'Ould Yengé',   wilayaId: 'GUI', center: [-12.72, 15.07], population:  5000 },
  { id: 'GHB',  name: 'Ghabou',       wilayaId: 'GUI', center: [-12.50, 15.55], population:  4000 },

  // ─── Trarza ────────────────────────────────────────────────────────
  { id: 'ROS',  name: 'Rosso',        wilayaId: 'TRA', center: [-15.81, 16.51], population: 50000 },
  { id: 'BTL',  name: 'Boutilimit',   wilayaId: 'TRA', center: [-14.69, 17.55], population: 10000 },
  { id: 'MDR',  name: 'Mederdra',     wilayaId: 'TRA', center: [-15.69, 17.05], population:  3000 },

  // ─── Tagant ────────────────────────────────────────────────────────
  { id: 'TID',  name: 'Tidjikja',     wilayaId: 'TAG', center: [-11.43, 18.55], population:  7000 },
  { id: 'TIC',  name: 'Tichit',       wilayaId: 'TAG', center: [ -9.51, 18.45], population:  3000 },
  { id: 'MOU',  name: 'Moudjéria',    wilayaId: 'TAG', center: [-12.45, 17.86], population:  5000 },

  // ─── Adrar (oasis sahariennes) ─────────────────────────────────────
  { id: 'ATR',  name: 'Atar',         wilayaId: 'ADR', center: [-13.05, 20.51], population: 25000 },
  { id: 'CHG',  name: 'Chinguetti',   wilayaId: 'ADR', center: [-12.36, 20.46], population:  4500 },
  { id: 'OUD',  name: 'Ouadane',      wilayaId: 'ADR', center: [-11.62, 20.93], population:  3000 },

  // ─── Inchiri ───────────────────────────────────────────────────────
  { id: 'AKJ',  name: 'Akjoujt',      wilayaId: 'INC', center: [-12.36, 19.74], population:  9000 },

  // ─── Tiris Zemmour (extrême nord) ──────────────────────────────────
  { id: 'ZOU',  name: 'Zouérate',     wilayaId: 'TIR', center: [-12.71, 22.74], population: 38000 },
  { id: 'FDR',  name: 'F’Dérik', wilayaId: 'TIR', center: [-12.71, 22.66], population:  3000 },

  // ─── Dakhlet Nouadhibou ────────────────────────────────────────────
  { id: 'BLN',  name: 'Boulanouar',   wilayaId: 'DAK', center: [-15.59, 20.07], population:  5000 },
]
