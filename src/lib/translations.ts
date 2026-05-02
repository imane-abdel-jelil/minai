/**
 * Traductions anglaises de MINAI.
 *
 * Clé = phrase française telle qu'écrite dans les composants.
 * Valeur = traduction anglaise.
 *
 * Pour ajouter une traduction : copier la phrase FR exacte du composant
 * comme clé, et écrire la version EN comme valeur. Apostrophes et accents
 * doivent matcher exactement.
 */

export const TRANSLATIONS_EN: Record<string, string> = {
  // ─── NAV (Landing + Comprendre) ───────────────────────────────────────
  'Accès à l’eau': 'Water access',
  'Problème': 'Problem',
  'Solution': 'Solution',
  'Impact': 'Impact',
  'SDG 6': 'SDG 6',
  'Collaboration': 'Collaboration',
  'Voir la cartographie →': 'See the map →',
  'Voir la cartographie': 'See the map',
  'Ouvrir le menu': 'Open menu',
  'Fermer le menu': 'Close menu',

  // ─── HERO LANDING ──────────────────────────────────────────────────────
  'Initiative géospatiale · Mauritanie': 'Geospatial initiative · Mauritania',
  'Making the invisible': 'Making the invisible',
  'visible again.': 'visible again.',
  'MINAI est une initiative d’intelligence géospatiale dédiée à l’accès à l’eau potable en Mauritanie. Elle vise à rendre visibles les communautés aujourd’hui absentes des systèmes de décision.':
    'MINAI is a geospatial intelligence initiative dedicated to drinking water access in Mauritania. Its goal is to make visible the communities that are currently absent from decision-making systems.',
  'personnes en zones critiques': 'people in critical zones',
  'Sources : ANSADE · UNICEF · World Bank': 'Sources: ANSADE · UNICEF · World Bank',
  'Collaborer': 'Collaborate',
  'Pourquoi l’accès à l’eau ?': 'Why water access?',
  'Comprendre l’enjeu →': 'Understand the issue →',

  // ─── HERO IMAGE CAPTION ────────────────────────────────────────────────
  'Mauritanie · Le quotidien de l’accès à l’eau': 'Mauritania · The daily reality of water access',

  // ─── CONTEXTE (Landing) ────────────────────────────────────────────────
  'Contexte': 'Context',
  'Un enjeu global,': 'A global issue,',
  'une réalité locale.': 'a local reality.',
  'En Afrique subsaharienne, des centaines de millions de personnes vivent sans accès fiable à l’eau potable.':
    'In sub-Saharan Africa, hundreds of millions of people live without reliable access to drinking water.',
  'En Mauritanie, cette situation est particulièrement marquée dans les zones rurales, où l’accès dépend de la distance, de la disponibilité et de la régularité des ressources.':
    'In Mauritania, this situation is particularly pronounced in rural areas, where access depends on distance, availability, and regularity of resources.',
  'Une réalité qui reste partiellement invisible dans les systèmes de décision.':
    'A reality that remains partially invisible in decision-making systems.',
  'World Bank': 'World Bank',
  'Indicator SH.H2O.BASW.ZS': 'Indicator SH.H2O.BASW.ZS',
  'de la population rurale en Mauritanie dispose d’un accès à une source d’eau améliorée.':
    'of the rural population in Mauritania has access to an improved water source.',
  'Voir l’indicateur': 'See the indicator',

  // ─── PROBLÈME (Landing) ────────────────────────────────────────────────
  'Le problème': 'The problem',
  'Ce n’est pas un manque de ressources.': 'It is not a lack of resources.',
  'C’est un manque de visibilité.': 'It is a lack of visibility.',
  'Dans les zones rurales du sud mauritanien, des villages se trouvent à plus de cinq kilomètres du point d’eau le plus proche. Ils n’apparaissent pas systématiquement comme prioritaires dans les systèmes officiels d’aide à la décision.':
    'In the rural areas of southern Mauritania, villages are located more than five kilometers from the nearest water point. They do not systematically appear as priorities in official decision-support systems.',
  'Ce qui n’est pas vu n’est pas servi.': 'What is not seen is not served.',
  'Données fragmentées': 'Fragmented data',
  'Les informations existent — UNICEF, ANSADE, OpenStreetMap, ONG. Elles restent dispersées et difficilement exploitables.':
    'The information exists — UNICEF, ANSADE, OpenStreetMap, NGOs. It remains scattered and difficult to use.',
  'Territoires invisibles': 'Invisible territories',
  'Une part importante des zones rurales n’est pas correctement représentée dans les systèmes d’aide à la décision.':
    'A significant share of rural areas is not properly represented in decision-support systems.',
  'Interventions non priorisées': 'Unprioritised interventions',
  'Les ressources sont mobilisées là où les données sont visibles, pas nécessairement là où les besoins sont les plus critiques.':
    'Resources are mobilised where data is visible, not necessarily where needs are most critical.',
  'Les données existent.': 'The data exists.',
  'Elles ne deviennent pas systématiquement des décisions.':
    'It does not systematically become decisions.',

  // ─── CONSÉQUENCES — galerie pain-point ─────────────────────────────────
  'Les conséquences': 'The consequences',
  'Quand un territoire devient invisible,': 'When a territory becomes invisible,',
  'ses habitants aussi.': 'its inhabitants do too.',
  'Marche quotidienne pour l’eau': 'Daily walk for water',
  'L’enfance face à la pompe': 'Childhood at the pump',
  'Le geste qu’on tient pour acquis': 'The gesture we take for granted',

  // ─── HUMAN IMPACT (Landing) ────────────────────────────────────────────
  'Derrière chaque zone invisible,': 'Behind every invisible zone,',
  'il y a une réalité.': 'there is a reality.',
  'Des femmes qui marchent plusieurs heures pour un accès limité à l’eau.':
    'Women who walk for hours for limited access to water.',
  'Des enfants qui quittent l’école pour subvenir aux besoins du foyer.':
    'Children who leave school to provide for the household.',
  'Des communautés entières en attente d’une intervention qui ne vient pas.':
    'Entire communities waiting for an intervention that never comes.',
  'Ce qui n’est pas visible': 'What is not visible',
  'ne peut pas être servi.': 'cannot be served.',

  // ─── SOLUTION (Landing) ────────────────────────────────────────────────
  'L’initiative': 'The initiative',
  'Rendre les données existantes': 'Turning existing data',
  'utilisables pour décider.': 'into actionable insight.',
  'MINAI ne collecte pas de nouvelles données. L’initiative croise et structure les informations institutionnelles déjà publiques pour révéler ce qu’elles ne montrent pas seules : les zones où l’accès à l’eau potable est insuffisant et où les interventions sont les plus urgentes.':
    'MINAI does not collect new data. The initiative cross-references and structures already public institutional information to reveal what it does not show alone: the areas where access to drinking water is insufficient and where interventions are most urgent.',
  'Cartographier les zones sous-desservies': 'Mapping underserved areas',
  'Croisement des données démographiques (ANSADE), des infrastructures (OpenStreetMap) et des standards humanitaires.':
    'Cross-referencing demographic data (ANSADE), infrastructure (OpenStreetMap), and humanitarian standards.',
  'Révéler les priorités': 'Revealing priorities',
  'Score d’accès calculé selon la norme humanitaire Sphere — un point d’eau pour cinq cents habitants.':
    'Access score computed against the Sphere humanitarian standard — one water point per five hundred people.',
  'Soutenir la décision publique': 'Supporting public decision-making',
  'Une vision commune et vérifiable, accessible aux ONG, aux institutions et aux décideurs locaux.':
    'A shared, verifiable view accessible to NGOs, institutions, and local decision-makers.',
  'De la donnée à l’action.': 'From data to action.',

  // ─── BY THE NUMBERS (Landing) ──────────────────────────────────────────
  'Aujourd’hui en Mauritanie': 'Today in Mauritania',
  'Trois chiffres. Trois sources publiques.': 'Three numbers. Three public sources.',
  'Une seule réalité.': 'One single reality.',
  'ANSADE': 'ANSADE',
  'Recensement RGPH 2013': 'RGPH 2013 Census',
  'habitants en milieu rural': 'inhabitants in rural areas',
  'Office national de la statistique mauritanien. Population mauritanienne ventilée par wilaya, avec répartition urbain / rural.':
    'Mauritanian national statistics office. Mauritanian population broken down by wilaya, with urban / rural split.',
  'Open Data Bank : indicateurs de développement, accès à l\'eau et sanitation, par pays.':
    'Open Data Bank: development indicators, water access and sanitation, by country.',
  'population rurale avec eau améliorée': 'rural population with improved water',
  'UNICEF · WHO': 'UNICEF · WHO',
  'Joint Monitoring Programme': 'Joint Monitoring Programme',
  'enfant sans eau de base au Sahel': 'child without basic water in the Sahel',
  'JMP : suivi mondial de l\'accès à l\'eau, l\'assainissement et l\'hygiène — profil Mauritanie.':
    'JMP: global monitoring of water, sanitation and hygiene — Mauritania profile.',
  'Consulter la source': 'View source',
  'Ces chiffres sont publics.': 'These numbers are public.',
  'Ils ne sont pas systématiquement croisés avec le terrain.':
    'They are not systematically cross-referenced with the field.',

  // ─── SDG 6 (Landing) ───────────────────────────────────────────────────
  'Nations Unies · Objectif 6': 'United Nations · Goal 6',
  'Eau propre et assainissement,': 'Clean water and sanitation,',
  'pour tous, d’ici 2030.': 'for all, by 2030.',
  'L’objectif de développement durable n°6 vise un accès universel et équitable à l’eau potable d’ici 2030. En Mauritanie, le rythme actuel ne permet pas d’y parvenir.':
    'Sustainable Development Goal 6 aims for universal and equitable access to drinking water by 2030. In Mauritania, the current pace does not allow this to be reached.',
  'MINAI s’inscrit dans cet effort': 'MINAI contributes to this effort',
  'en rendant visibles les zones où l’accélération est la plus nécessaire, et en mettant à disposition des décideurs publics une lecture commune du territoire.':
    'by making visible the areas where acceleration is most needed, and by giving public decision-makers a shared reading of the territory.',
  'Comprendre l’enjeu en détail': 'Understand the issue in detail',

  // ─── COLLABORATION (Landing) ───────────────────────────────────────────
  'Une initiative ouverte': 'An initiative open',
  'aux acteurs de l’eau.': 'to water sector actors.',
  'MINAI est conçue pour être partagée. Toute organisation engagée dans l’accès à l’eau potable — ONG, institution publique, agence internationale — peut s’en saisir, contribuer ou en demander l’adaptation à son contexte d’intervention.':
    'MINAI is designed to be shared. Any organisation engaged in drinking water access — NGO, public institution, international agency — can use it, contribute, or request its adaptation to their intervention context.',
  'L’initiative travaille avec ses partenaires pour :':
    'The initiative works with its partners to:',
  'Identifier les priorités d’intervention': 'Identify intervention priorities',
  'Optimiser l’allocation des ressources': 'Optimise resource allocation',
  'Renforcer l’impact des actions terrain': 'Strengthen field impact',
  'Visualiser les zones prioritaires': 'View priority zones',
  'Contacter l’initiative': 'Contact the initiative',

  // ─── FOOTER ────────────────────────────────────────────────────────────
  'making the invisible visible again.': 'making the invisible visible again.',
  'Nouakchott, Mauritanie · © 2026 MINAI': 'Nouakchott, Mauritania · © 2026 MINAI',
  'Aligned with UN SDG 6 · Sources : ANSADE · UNICEF · World Bank · OpenStreetMap':
    'Aligned with UN SDG 6 · Sources: ANSADE · UNICEF · World Bank · OpenStreetMap',

  // ═════════════════════════════════════════════════════════════════════
  // PAGE COMPRENDRE
  // ═════════════════════════════════════════════════════════════════════

  'MINAI · Comprendre': 'MINAI · Understand',
  'L’eau, condition': 'Water,',
  'd’existence.': 'a condition of existence.',
  'Sans accès à l’eau, rien ne fonctionne durablement —':
    'Without access to water, nothing works sustainably —',
  'ni la santé, ni l’éducation, ni l’économie.':
    'not health, not education, not the economy.',
  'Pourtant, aujourd’hui encore, l’accès à l’eau potable reste incertain.':
    'Yet, even today, access to drinking water remains uncertain.',
  '« L’eau est le principe de toute chose. » — Thalès de Milet':
    '“Water is the principle of all things.” — Thales of Miletus',

  'Mais cette réalité n’est pas répartie de manière égale.':
    'But this reality is not distributed equally.',
  'Pour certaines communautés,': 'For some communities,',
  'l’accès à l’eau dépend de plusieurs heures de marche.':
    'access to water depends on hours of walking.',
  'Chaque jour.': 'Every day.',

  'Ce déséquilibre se traduit en conséquences concrètes.':
    'This imbalance translates into concrete consequences.',
  'L’accès à l’eau ne détermine pas': 'Access to water determines',
  'seulement la survie.': 'more than survival.',
  'Il détermine la capacité à vivre.': 'It determines the ability to live.',
  'Santé fragilisée.': 'Weakened health.',
  'Scolarité interrompue.': 'Interrupted schooling.',
  'Activité économique limitée.': 'Limited economic activity.',
  'En Mauritanie, l’eau n’est pas absente. Elle est difficilement accessible : villages éloignés des points d’eau, ressources irrégulières, infrastructures inégalement réparties.':
    'In Mauritania, water is not absent. It is difficult to access: villages far from water points, irregular resources, infrastructure unevenly distributed.',

  'Ce constat est connu. Il est même reconnu :':
    'This is known. It is even recognised:',
  'l’accès à l’eau': 'access to water',
  'est un droit humain fondamental.': 'is a fundamental human right.',
  'Mais malgré cette reconnaissance, toutes les zones ne sont pas identifiées avec la même précision. Dans de nombreux cas, les communautés les plus exposées restent en dehors des systèmes de décision.':
    'But despite this recognition, not all areas are identified with the same precision. In many cases, the most exposed communities remain outside decision-making systems.',
  'Objectif de développement durable n°6':
    'Sustainable Development Goal 6',
  '— Eau propre et assainissement, Nations Unies.':
    '— Clean Water and Sanitation, United Nations.',

  'Le problème n’est pas un manque de données.':
    'The problem is not a lack of data.',
  'Mais elles ne sont pas croisées.': 'But it is not cross-referenced.',
  'ANSADE, UNICEF, World Bank, OpenStreetMap : les informations sont disponibles, mais dispersées. Sans une lecture claire du terrain, les priorités ne sont pas toujours établies.':
    'ANSADE, UNICEF, World Bank, OpenStreetMap: the information is available, but scattered. Without a clear reading of the field, priorities are not always established.',
  'Le défi n’est pas uniquement d’agir.': 'The challenge is not only to act.',
  'Le défi est de savoir où agir en premier.':
    'The challenge is knowing where to act first.',

  'C’est là que MINAI intervient.': 'This is where MINAI comes in.',
  'Identifier les zones critiques.': 'Identify critical zones.',
  'Prioriser les interventions.': 'Prioritise interventions.',
  'MINAI aide les ONG et les institutions à identifier les zones où l’accès à l’eau est le plus critique en Mauritanie, et à orienter leurs interventions là où elles auront le plus d’impact.':
    'MINAI helps NGOs and institutions identify areas where water access is most critical in Mauritania, and direct their interventions where they will have the greatest impact.',
  'La carte rend visible ce que les données isolées ne montrent pas.':
    'The map makes visible what isolated data does not show.',

  // Captions images Comprendre
  'Une intervention. Des centaines d’attentes.':
    'One intervention. Hundreds waiting.',

  // ═════════════════════════════════════════════════════════════════════
  // SIDEBAR — Carte
  // ═════════════════════════════════════════════════════════════════════

  'Cartographie de l’accès à l’eau · Mauritanie':
    'Mapping water access · Mauritania',
  'Décision · Prochain convoi': 'Decision · Next convoy',
  '🚛 Recommandation MINAI': '🚛 MINAI recommendation',
  'Prochaine intervention prioritaire selon les données disponibles.':
    'Next priority intervention based on available data.',
  'Distance au point d’eau': 'Distance to water point',
  'Population': 'Population',
  'Approvisionnement récent': 'Recent supply',
  'aucun renseigné': 'none recorded',
  'Intervention recommandée': 'Recommended intervention',
  'sous 48 h': 'within 48 h',
  'sous 30 jours': 'within 30 days',
  'pas d’action urgente': 'no urgent action',
  '🚛 Tracer le convoi sur la carte': '🚛 Plot convoy on the map',
  '✓ Convoi tracé sur la carte': '✓ Convoy plotted on the map',
  'Zones prioritaires aujourd’hui': 'Priority zones today',
  'Calcul des priorités en cours…': 'Computing priorities…',
  '🚛 Tracer le convoi': '🚛 Plot convoy',
  'Effacer': 'Clear',
  'Wilaya :': 'Wilaya:',
  'Niveau d’urgence': 'Urgency level',
  'habitants': 'inhabitants',
  'Dernière intervention': 'Last intervention',
  'Non renseignée': 'Not recorded',
  '🚛 Cibler ce village pour le prochain convoi':
    '🚛 Target this village for the next convoy',
  'Vue nationale': 'National view',
  'Pop. rurale': 'Rural pop.',
  'Score moyen': 'Average score',
  'En zone critique': 'In critical zone',
  'Villages suivis': 'Villages tracked',
  'Villages': 'Villages',
  'Localités évaluées (statut Critique / Risque / OK)':
    'Evaluated localities (Critical / At risk / OK status)',
  'Frontières des wilayas': 'Wilaya boundaries',
  '13 régions administratives, colorées par score':
    '13 administrative regions, coloured by score',
  'Points d’eau (OSM)': 'Water points (OSM)',
  'Puits, forages, fontaines, sources': 'Wells, boreholes, fountains, springs',
  'Statut village': 'Village status',
  'Critique': 'Critical',
  'Risque': 'At risk',
  'OK': 'OK',
  'distance > 5 km au point d’eau le plus proche':
    'distance > 5 km from nearest water point',
  'distance entre 2 et 5 km': 'distance between 2 and 5 km',
  'distance ≤ 2 km': 'distance ≤ 2 km',
  'Méthodologie': 'Methodology',
  'Pour chaque village, on calcule la distance au point d’eau OSM le plus proche. Le statut est défini selon des seuils opérationnels sahéliens. La priorité est pondérée par la population du village.':
    'For each village, we compute the distance to the nearest OSM water point. The status is defined by Sahelian operational thresholds. The priority is weighted by the village population.',
  'Filtres par type': 'Filter by type',
  'Tout': 'All',
  'Aucun': 'None',
  'Eau potable / fontaines': 'Drinking water / fountains',
  'Points d’eau': 'Water points',
  'Puits': 'Wells',
  'Forages': 'Boreholes',
  'Sources': 'Springs',
  'Robinets': 'Taps',
  'Stations de pompage': 'Pumping stations',
  'Autres': 'Others',
  'Démo v0.4 · Villages curés + OSM Overpass.':
    'Demo v0.4 · Curated villages + OSM Overpass.',
  'Sources : ANSADE · UNICEF/JMP · World Bank · OpenStreetMap.':
    'Sources: ANSADE · UNICEF/JMP · World Bank · OpenStreetMap.',
  'Fermer le panneau': 'Close panel',

  // Bouton retour MINAI sur la carte
  '← MINAI': '← MINAI',
  'Panneau': 'Panel',
  'Retour à la page d\'accueil': 'Back to homepage',
  'Ouvrir le panneau': 'Open panel',
}
