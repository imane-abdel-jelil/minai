import { memo, useState, useMemo, useEffect, useRef } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl, type MapLayerMouseEvent, type MapRef } from 'react-map-gl'
import { MAURITANIA_REGIONS, type Region } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import { findWilayaId } from '../lib/ansade-villages'
import { countPointsByWilaya, type WilayaStats } from '../lib/geo'
import type { ComputedScore } from '../lib/score'
import type { VillageEval } from '../lib/villages'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// Origine par défaut des convois NGO simulés : Nouakchott (capitale, port,
// principal hub logistique humanitaire en Mauritanie).
const CONVOY_ORIGIN: [number, number] = [-15.97, 18.08]
const CONVOY_ORIGIN_NAME = 'Nouakchott'

// ─── Paint/Layout objects en MODULE-LEVEL constants ─────────────────
// Ces objets sont passés aux <Layer> de Mapbox. S'ils sont définis
// inline dans le JSX, ils sont recréés à chaque render React → Mapbox
// croit que paint/layout a changé → setPaintProperty appelé → traitement
// lourd des features → canvas momentanément vide → 'écran noir'.
// Définis hors composant = même référence pour toujours.
const DRILL_HALO_PAINT = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    5, 5, 8, 7, 12, 11,
  ],
  'circle-color': '#ffffff',
  'circle-opacity': 0.85,
} as never
const DRILL_MARKERS_PAINT = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    5, 3.5, 8, 5, 12, 9,
  ],
  'circle-color': ['get', 'color'],
  'circle-stroke-color': ['get', 'color'],
  'circle-stroke-width': 1,
  'circle-opacity': 0.95,
} as never
const DRILL_LABEL_LAYOUT = {
  'text-field': ['get', 'nom_fr'],
  'text-size': 10,
  'text-offset': [0, 1.1],
  'text-anchor': 'top',
  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  'text-allow-overlap': false,
  'text-optional': true,
} as never
const DRILL_LABEL_PAINT = {
  'text-color': '#ffffff',
  'text-halo-color': '#0c4a6e',
  'text-halo-width': 1.4,
} as never

interface Props {
  onRegionClick: (region: Region | null) => void
  /** Optionnel 2ème argument : VillageEval construit à partir des
   *  feature.properties au clic. Permet d'afficher le panneau village
   *  sans attendre que le gros fichier 8 Mo soit chargé. */
  onVillageClick: (village: Village | null, ev?: VillageEval | null) => void
  /** Wilaya en mode drill-down (clic wilaya). Null = vue nationale (priorités). */
  selectedWilaya: Region | null
  showWaterPoints: boolean
  showWilayas: boolean
  showVillages: boolean
  onStatsReady?: (stats: Record<string, WilayaStats>) => void
  onWaterPointsReady?: (data: GeoJSON.FeatureCollection | null) => void
  kindFilters: Record<string, boolean>
  computedScores: Record<string, ComputedScore>
  villageEvals: VillageEval[]
  /** GeoJSON ANSADE pré-calculé (8447 villages) — null si pas encore chargé */
  villagesGeojson: GeoJSON.FeatureCollection | null
  /** Village cible du convoi simulé (null = aucun convoi affiché) */
  convoyTarget: Village | null
}

interface WaterPointPopup {
  lng: number
  lat: number
  kind: string
  name: string | null
  source: string
  drinkable?: string | null
  status?: string | null
}

const KIND_LABELS: Record<string, string> = {
  drinking_water: 'Eau potable / fontaine',
  water_point: 'Point d’eau',
  well: 'Puits',
  borehole: 'Forage',
  spring: 'Source naturelle',
  tap: 'Robinet',
  water_works: 'Station de pompage',
  other: 'Autre',
}

// Couleurs par type — alignées avec la sidebar
const KIND_COLORS: Record<string, string> = {
  drinking_water: '#06b6d4',
  water_point: '#06b6d4',
  well: '#f59e0b',
  borehole: '#10b981',
  spring: '#14b8a6',
  tap: '#3b82f6',
  water_works: '#8b5cf6',
  other: '#9ca3af',
}

// Éclaircit une couleur hex pour faire le sommet du dégradé radial
function lighten(hex: string, amount = 0.45): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map((c) => parseInt(c, 16))
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** SVG d'une jolie goutte d'eau colorée (avec dégradé + reflet blanc). */
function dropletSvg(color: string, gradientId: string): string {
  const top = lighten(color, 0.55)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 56 72">
  <defs>
    <radialGradient id="${gradientId}" cx="38%" cy="35%" r="68%">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="100%" stop-color="${color}"/>
    </radialGradient>
  </defs>
  <path d="M28 3 C18 22 8 38 8 50 a20 20 0 0 0 40 0 c0 -12 -10 -28 -20 -47 z"
        fill="url(#${gradientId})"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linejoin="round"/>
  <ellipse cx="20" cy="36" rx="3.5" ry="7" fill="#ffffff" opacity="0.6" transform="rotate(-22 20 36)"/>
</svg>`
}

/** Convertit un SVG en data-URL utilisable par Image() puis Mapbox addImage(). */
function svgToDataUrl(svg: string): string {
  // encodeURIComponent gère mieux l'unicode que btoa
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** Charge un SVG comme image bitmap puis l'enregistre sous ce nom dans la carte. */
async function registerDropletIcon(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  name: string,
  color: string
): Promise<void> {
  if (map.hasImage(name)) return
  const svg = dropletSvg(color, `g-${name}`)
  return new Promise((resolve) => {
    const img = new Image(56, 72)
    img.onload = () => {
      try {
        if (!map.hasImage(name)) map.addImage(name, img)
      } catch (e) {
        console.warn('addImage', name, e)
      }
      resolve()
    }
    img.onerror = () => resolve()
    img.src = svgToDataUrl(svg)
  })
}

// Normalisation pour matcher les noms entre geoBoundaries et nos régions
function normName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z]/g, '')
}

function findRegion(name: string): Region | undefined {
  const target = normName(name)
  // match direct, puis match partiel (Nouakchott Nord/Sud/Ouest → Nouakchott)
  return (
    MAURITANIA_REGIONS.find((r) => normName(r.name) === target) ||
    MAURITANIA_REGIONS.find((r) => target.includes(normName(r.name))) ||
    MAURITANIA_REGIONS.find((r) => normName(r.name).includes(target))
  )
}

function MapView({
  onRegionClick,
  onVillageClick,
  selectedWilaya,
  showWaterPoints,
  showWilayas,
  showVillages,
  onStatsReady,
  onWaterPointsReady,
  kindFilters,
  computedScores,
  villageEvals,
  villagesGeojson,
  convoyTarget,
}: Props) {
  const mapRef = useRef<MapRef | null>(null)
  const [waterPopup, setWaterPopup] = useState<WaterPointPopup | null>(null)
  const [waterPoints, setWaterPoints] = useState<GeoJSON.FeatureCollection | null>(null)
  const [wilayasGeo, setWilayasGeo] = useState<GeoJSON.FeatureCollection | null>(null)
  // Petit fichier (~37 KB) qui contient JUSTE les 54 pins de priorités
  // (30 critiques + 24 success stories). Indépendant du gros fichier
  // villages-scored.geojson (8 Mo) qui peut traîner ou échouer sur un
  // réseau lent. → garantit que les pins s'affichent TOUT DE SUITE.
  const [priorities, setPriorities] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetch('/data/villages-priorities.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: GeoJSON.FeatureCollection | null) => {
        if (!data) return
        // Enrichit chaque feature avec wilayaId — sinon le clic sur un
        // pin construit un village avec wilayaId='' qui empêche
        // l'affichage correct du panneau dans la sidebar.
        const enriched: GeoJSON.FeatureCollection = {
          ...data,
          features: data.features.map((f) => {
            const props = f.properties || {}
            return {
              ...f,
              properties: {
                ...props,
                wilayaId: findWilayaId(props.wilaya as string | null) ?? '',
              },
            }
          }),
        }
        setPriorities(enriched)
      })
      .catch((e) => console.warn('Pas de fichier priorités :', e))
  }, [])

  // Charger les points d'eau réels depuis public/data/water-points.geojson
  useEffect(() => {
    fetch('/data/water-points.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setWaterPoints(data)
          onWaterPointsReady?.(data)
        }
      })
      .catch((e) => console.warn('Pas de données points d’eau :', e))
  }, [onWaterPointsReady])

  // Charger les polygones bruts des wilayas — l'enrichissement (score/couleur live)
  // est fait dans un useMemo en aval pour réagir aux changements de scores.
  useEffect(() => {
    fetch('/data/wilayas.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.features) setWilayasGeo(data)
      })
      .catch((e) => console.warn('Pas de polygones wilayas :', e))
  }, [])

  // Wilayas enrichies = polygones bruts + score live + couleur dérivée + regionId.
  // Recalculé à chaque changement de scores (donc dès que les stats arrivent).
  const enrichedWilayas = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!wilayasGeo) return null
    return {
      ...wilayasGeo,
      features: wilayasGeo.features.map((f) => {
        const props = f.properties || {}
        const rawName = (props.shapeName as string) || (props.name as string) || 'Wilaya'
        const matched = findRegion(rawName)
        const live = matched ? computedScores[matched.id] : undefined
        return {
          ...f,
          properties: {
            ...props,
            regionId: matched?.id ?? null,
            regionName: matched?.name ?? rawName,
            score: live?.score ?? null,
            color: live?.color ?? '#9ca3af',
          },
        }
      }),
    }
  }, [wilayasGeo, computedScores])

  // Une fois que les 2 datasets sont chargés, compte les points par wilaya
  useEffect(() => {
    if (!waterPoints || !wilayasGeo || !onStatsReady) return
    const stats = countPointsByWilaya(wilayasGeo, waterPoints, 'regionId')
    onStatsReady(stats)
  }, [waterPoints, wilayasGeo, onStatsReady])

  // ─── Villages ANSADE — pré-enrichis par ansade-villages.ts ────────────
  // villagesGeojson contient déjà 8447 features avec status, color,
  // wilayaId injectés. On l'utilise tel quel SANS le re-cloner à chaque
  // selectedVillage : sinon Mapbox réuploadait 8 Mo à chaque clic et
  // la couche disparaissait quelques centaines de ms (effet 'écran bleu'
  // sur les villages côtiers où le fond satellite est de l'eau).
  // Le highlight du village sélectionné est géré par une couche overlay
  // filtrée séparément (voir village-selected-highlight ci-dessous).
  const villagesEnriched = villagesGeojson

  // (Le filtrage des couches village est maintenant géré inline dans
  //  les filter={['==', ...]} de chaque Layer ci-dessous, en fonction
  //  du mode vue nationale (heatmap+pins) ou drill-down wilaya.)

  // ─── Convoi NGO simulé ────────────────────────────────────────────────────
  // Ligne droite de Nouakchott vers la wilaya cible. Visuellement subtil
  // (pointillés cyan + halo blanc + cercles concentriques au point d'arrivée).
  const convoyRouteGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!convoyTarget) return null
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [CONVOY_ORIGIN, convoyTarget.center],
          },
          properties: {},
        },
      ],
    }
  }, [convoyTarget])

  const convoyEndpointsGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!convoyTarget) return null
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: CONVOY_ORIGIN },
          properties: { label: `Départ : ${CONVOY_ORIGIN_NAME}`, role: 'origin' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: convoyTarget.center },
          properties: { label: `Cible : ${convoyTarget.name}`, role: 'target' },
        },
      ],
    }
  }, [convoyTarget])

  // easeTo désactivé : tout mouvement de caméra force Mapbox à
  // recharger des tuiles, ce qui peut faire apparaître le fond du body
  // pendant la transition. La carte reste statique au clic d'une wilaya
  // ou d'un village. L'utilisateur peut zoomer manuellement avec la
  // molette de la souris ou les boutons +/- de la NavigationControl.

  // ─── Filtres Mapbox memoizés ────────────────────────────────────────
  // Sans ça, le filter literal est recréé à chaque render et Mapbox
  // pense que le filtre a changé → il refait le filtrage des 8447
  // features → canvas momentanément vide → écran noir au clic d'un
  // village non-prioritaire. La memoization garde la même référence
  // tant que selectedWilaya ne change pas réellement.
  const drillFilter = useMemo(
    () =>
      selectedWilaya
        ? (['==', ['get', 'wilayaId'], selectedWilaya.id] as never)
        : null,
    [selectedWilaya],
  )
  const successFilter = useMemo(
    () => ['==', ['get', 'is_success_story'], 1] as never,
    [],
  )
  const topFilter = useMemo(
    () => ['==', ['get', 'is_top_priority'], 1] as never,
    [],
  )
  const priorityHaloFilter = useMemo(
    () =>
      [
        'any',
        ['==', ['get', 'is_top_priority'], 1],
        ['==', ['get', 'is_success_story'], 1],
      ] as never,
    [],
  )

  // Quand un convoi est tracé, on cadre la carte pour que origine + cible
  // soient toutes les deux visibles, avec un peu de marge.
  useEffect(() => {
    if (!convoyTarget || !mapRef.current) return
    const map = mapRef.current
    const minLng = Math.min(CONVOY_ORIGIN[0], convoyTarget.center[0]) - 0.4
    const maxLng = Math.max(CONVOY_ORIGIN[0], convoyTarget.center[0]) + 0.4
    const minLat = Math.min(CONVOY_ORIGIN[1], convoyTarget.center[1]) - 0.4
    const maxLat = Math.max(CONVOY_ORIGIN[1], convoyTarget.center[1]) + 0.4
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: { top: 80, bottom: 80, left: 60, right: 60 }, duration: 1200 }
    )
  }, [convoyTarget])

  // Filtrage par type — recalculé seulement quand les données ou les filtres changent
  const filteredWaterPoints = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!waterPoints) return null
    return {
      ...waterPoints,
      features: waterPoints.features.filter((f) => {
        const kind = (f.properties?.kind as string) || 'other'
        return kindFilters[kind] !== false
      }),
    }
  }, [waterPoints, kindFilters])

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith('pk.PASTE')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-water-900 text-white p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Token Mapbox manquant</h2>
        <p className="opacity-80 max-w-md">
          Crée un compte gratuit sur mapbox.com, copie ton token public, et colle-le dans
          le fichier <code className="bg-water-700 px-2 py-0.5 rounded">.env</code> à la racine
          du projet.
        </p>
      </div>
    )
  }

  return (
    <>
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      // Recadrage : centre légèrement décalé vers le sud (où sont les
      // populations rurales) et zoom plus serré pour mieux remplir le viewport.
      initialViewState={{ longitude: -11, latitude: 19.5, zoom: 5.1 }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      // backgroundColor explicite : si pour une raison quelconque les
      // tuiles satellite ne se chargent pas (rate-limit Mapbox, lenteur
      // réseau), on voit cette couleur au lieu du body — ce qui permet
      // d'identifier précisément où vient le problème.
      style={{ width: '100%', height: '100%', backgroundColor: '#3a2f24' }}
      interactiveLayerIds={[
        // Pins TOP-30 (rouges) + success (verts) en vue nationale,
        // dots drill-down sinon.
        ...(showVillages && !selectedWilaya ? ['village-top', 'village-success'] : []),
        ...(showVillages && selectedWilaya ? ['village-markers'] : []),
        ...(showWilayas && enrichedWilayas ? ['wilaya-fill'] : []),
        ...(showWaterPoints && filteredWaterPoints ? ['water-unclustered'] : []),
      ]}
      cursor={waterPopup ? 'pointer' : 'grab'}
      onLoad={(e) => {
        // Trois gouttes bleues pour les clusters (taille croissante selon le compte).
        // À faire dans onLoad sinon addImage() crash si le style n'est pas prêt.
        const map = e.target
        registerDropletIcon(map, 'cluster-sm', '#06b6d4')
        registerDropletIcon(map, 'cluster-md', '#0ea5e9')
        registerDropletIcon(map, 'cluster-lg', '#0284c7')
      }}
      onClick={(e: MapLayerMouseEvent) => {
        const feature = e.features?.[0]
        if (!feature?.properties) {
          onRegionClick(null)
          onVillageClick(null)
          setWaterPopup(null)
          return
        }
        if (feature.layer && (
          feature.layer.id === 'village-markers' ||
          feature.layer.id === 'village-top' ||
          feature.layer.id === 'village-success'
        )) {
          // Click village ANSADE (pin TOP-30, success, ou dot drill-down)
          // → ouvre le détail dans la sidebar. On reconstruit un objet
          // Village à partir des properties du feature.
          try {
            const p = feature.properties || {}
            const geom = feature.geometry as GeoJSON.Point
            // Garde-fous coordonnées : si pour une raison X les coords
            // sont invalides, on n'ouvre pas le panneau (évite plantage
            // de Mapbox sur un selectedVillage avec center=NaN).
            if (
              !geom || geom.type !== 'Point' ||
              !Array.isArray(geom.coordinates) ||
              geom.coordinates.length < 2 ||
              !Number.isFinite(geom.coordinates[0]) ||
              !Number.isFinite(geom.coordinates[1])
            ) {
              console.warn('Village clic ignoré : géométrie invalide', feature)
              return
            }
            const coords = geom.coordinates as [number, number]
            // wilayaId : essaie d'abord la prop directe, sinon résout
            // depuis le nom de wilaya ANSADE (cas du fichier priorities
            // qui n'a que le texte 'Hodh Chargui' / 'Adrar' / etc.)
            const wilayaId =
              (p.wilayaId as string) ||
              findWilayaId(p.wilaya as string | null) ||
              ''
            const village: Village = {
              id: String(p.code_localite ?? ''),
              name: (p.nom_fr as string) || '(sans nom)',
              wilayaId,
              center: coords,
              population: Number(p.population_total) || 0,
            }
            // Construit l'eval directement depuis les properties
            // (toutes pré-calculées par compute-village-scores.mjs).
            // Le panneau s'affiche IMMÉDIATEMENT, sans attendre que
            // le gros fichier de 8 Mo soit chargé.
            const status = (p.status as VillageEval['status']) || 'ok'
            const distanceToWaterKm = Number(p.distance_to_water_km) || 0
            const priorityScore = Number(p.priority_score) || 0
            const nearestWaterPoint: [number, number] | null =
              p.nearest_water_lng != null && p.nearest_water_lat != null
                ? [Number(p.nearest_water_lng), Number(p.nearest_water_lat)]
                : null
            const ev: VillageEval = {
              village,
              status,
              distanceToWaterKm,
              priorityScore,
              nearestWaterPoint,
            }
            // Update la sidebar + overlay flottant.
            onVillageClick(village, ev)
            // Force Mapbox à redessiner après le re-render React. Sans
            // ça le canvas peut rester vide visuellement (tuiles non
            // re-rendues), donnant l'impression d'écran noir.
            requestAnimationFrame(() => {
              try {
                mapRef.current?.resize()
              } catch (_e) {
                /* noop */
              }
            })
          } catch (err) {
            console.error('Erreur clic village :', err, feature)
          }
        } else if (feature.layer && feature.layer.id === 'wilaya-fill') {
          const id = feature.properties.regionId as string | null
          if (id) {
            const region = MAURITANIA_REGIONS.find((r) => r.id === id)
            if (region) onRegionClick(region)
          }
        } else if (feature.layer && feature.layer.id === 'water-unclustered') {
          const coords = (feature.geometry as GeoJSON.Point).coordinates
          setWaterPopup({
            lng: coords[0],
            lat: coords[1],
            kind: (feature.properties.kind as string) || 'other',
            name: (feature.properties.name as string) || null,
            source: (feature.properties.source as string) || 'OSM',
            drinkable: feature.properties.drinkable as string | undefined,
            status: feature.properties.status as string | undefined,
          })
        }
      }}
    >
      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-right" />

      {/* ---------- Polygones des wilayas (couche du fond) ---------- */}
      {showWilayas && enrichedWilayas && (
        <Source id="wilayas" type="geojson" data={enrichedWilayas}>
          <Layer
            id="wilaya-fill"
            type="fill"
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.45,
            }}
          />
          <Layer
            id="wilaya-outline"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.9,
            }}
          />
          <Layer
            id="wilaya-name"
            type="symbol"
            layout={{
              'text-field': ['get', 'regionName'],
              'text-size': 11,
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-allow-overlap': false,
              'symbol-placement': 'point',
            }}
            paint={{
              'text-color': '#ffffff',
              'text-halo-color': '#0f172a',
              'text-halo-width': 1.5,
              'text-opacity': 0.7,
            }}
          />
        </Source>
      )}

      {/* ---------- Points d'eau réels (clusterisés, filtrés par type) ---------- */}
      {showWaterPoints && filteredWaterPoints && (
        <Source
          id="water-points"
          type="geojson"
          data={filteredWaterPoints}
          cluster={true}
          clusterRadius={45}
          clusterMaxZoom={12}
        >
          {/* Clusters → gouttes bleues avec compteur. Visibles dès la vue
              nationale mais discrets pour ne pas écraser les pins de
              priorité (rouges) et de référence (verts). */}
          <Layer
            id="water-clusters"
            type="symbol"
            filter={['has', 'point_count']}
            minzoom={4}
            layout={{
              'icon-image': [
                'step',
                ['get', 'point_count'],
                'cluster-sm', 20,
                'cluster-md', 100,
                'cluster-lg',
              ],
              'icon-size': [
                'step',
                ['get', 'point_count'],
                0.5, 20,
                0.72, 100,
                0.95,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-anchor': 'bottom',
              // Le compteur est posé sur le rond de la goutte (≈ centre du blob)
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'step',
                ['get', 'point_count'],
                12, 20,
                15, 100,
                18,
              ],
              'text-anchor': 'center',
              'text-offset': [0, -1.0],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            }}
            paint={{
              'icon-opacity': 1,
              'text-color': '#ffffff',
              'text-halo-color': '#0c4a6e',
              'text-halo-width': 1.6,
            }}
          />
          {/* Points individuels — apparaissent dès le zoom 6 pour montrer
              que les clusters cachent de vraies installations.
              Tous petits, pour ne pas concurrencer les pins de priorité. */}
          <Layer
            id="water-unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            minzoom={6}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                6, 2,
                8, 3,
                12, 5,
                16, 8,
              ],
              'circle-color': [
                'match',
                ['get', 'kind'],
                'drinking_water', '#06b6d4',
                'water_point', '#06b6d4',
                'well', '#f59e0b',
                'borehole', '#10b981',
                'spring', '#14b8a6',
                'tap', '#3b82f6',
                'water_works', '#8b5cf6',
                /* default */ '#9ca3af',
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.92,
            }}
          />
        </Source>
      )}

      {/* ───── Villages prioritaires (30 rouges) + success (24 verts) ─────
           Petits points discrets sans labels, sans rings — pour ne pas
           concurrencer visuellement les clusters d'eau bleus. L'utilisateur
           clique pour ouvrir le détail dans la sidebar. */}
      {showVillages && !selectedWilaya && priorities && (
        <Source id="priorities" type="geojson" data={priorities}>
          {/* Halo blanc commun (sous TOUS les pins) — fait ressortir le
              dot coloré sur fond satellite ou polygone wilaya. */}
          <Layer
            id="priority-halo"
            source="priorities"
            type="circle"
            filter={priorityHaloFilter}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, 6, 7, 8, 12, 12,
              ],
              'circle-color': '#ffffff',
              'circle-opacity': 0.95,
            }}
          />
          {/* Pins verts SUCCESS (posés en premier — les rouges passent
              au-dessus quand ils se chevauchent : urgence > référence). */}
          <Layer
            id="village-success"
            source="priorities"
            type="circle"
            filter={successFilter}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, 4, 7, 6, 12, 9,
              ],
              'circle-color': '#16a34a',
              'circle-stroke-color': '#14532d',
              'circle-stroke-width': 1,
              'circle-opacity': 1,
            }}
          />
          {/* Pins rouges TOP-30 (priorité visuelle absolue). */}
          <Layer
            id="village-top"
            source="priorities"
            type="circle"
            filter={topFilter}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, 4, 7, 6, 12, 9,
              ],
              'circle-color': '#dc2626',
              'circle-stroke-color': '#7f1d1d',
              'circle-stroke-width': 1,
              'circle-opacity': 1,
            }}
          />
        </Source>
      )}

      {/* ───── Villages drill-down (TOUS les villages d'une wilaya) ─────
           Source qui charge le gros fichier (8 Mo) — utilisé seulement
           quand une wilaya est sélectionnée. Lazy-load par défaut. */}
      {showVillages && villagesEnriched && (
        <Source id="villages" type="geojson" data={villagesEnriched}>
          {/* Dots drill-down : tous les villages d'une wilaya */}
          {selectedWilaya && (
            <>
              <Layer
                id="village-drill-halo"
                source="villages"
                type="circle"
                filter={drillFilter ?? undefined}
                paint={DRILL_HALO_PAINT}
              />
              <Layer
                id="village-markers"
                source="villages"
                type="circle"
                filter={drillFilter ?? undefined}
                paint={DRILL_MARKERS_PAINT}
              />
              <Layer
                id="village-drill-label"
                source="villages"
                type="symbol"
                filter={drillFilter ?? undefined}
                layout={DRILL_LABEL_LAYOUT}
                paint={DRILL_LABEL_PAINT}
                minzoom={7}
              />
            </>
          )}
        </Source>
      )}

      {/* ---------- Convoi NGO simulé (ligne + marqueurs origine/cible) ---------- */}
      {convoyRouteGeoJSON && (
        <Source id="convoy-route" type="geojson" data={convoyRouteGeoJSON}>
          {/* Halo blanc autour de la ligne pour la lisibilité sur fond satellite */}
          <Layer
            id="convoy-line-halo"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 7,
              'line-opacity': 0.45,
              'line-blur': 1.2,
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          {/* Trait pointillé cyan principal */}
          <Layer
            id="convoy-line"
            type="line"
            paint={{
              'line-color': '#06b6d4',
              'line-width': 3,
              'line-dasharray': [2, 2],
              'line-opacity': 0.95,
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>
      )}
      {convoyEndpointsGeoJSON && (
        <Source id="convoy-endpoints" type="geojson" data={convoyEndpointsGeoJSON}>
          {/* Cible : 3 cercles concentriques pour effet "destination" */}
          <Layer
            id="convoy-target-outer"
            type="circle"
            filter={['==', ['get', 'role'], 'target']}
            paint={{
              'circle-radius': 22,
              'circle-color': 'rgba(6,182,212,0.18)',
              'circle-stroke-color': '#06b6d4',
              'circle-stroke-width': 1,
              'circle-stroke-opacity': 0.6,
            }}
          />
          <Layer
            id="convoy-target-mid"
            type="circle"
            filter={['==', ['get', 'role'], 'target']}
            paint={{
              'circle-radius': 13,
              'circle-color': 'rgba(6,182,212,0.35)',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
            }}
          />
          <Layer
            id="convoy-target-inner"
            type="circle"
            filter={['==', ['get', 'role'], 'target']}
            paint={{
              'circle-radius': 5,
              'circle-color': '#06b6d4',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            }}
          />
          {/* Origine : petit cercle blanc bordé cyan */}
          <Layer
            id="convoy-origin"
            type="circle"
            filter={['==', ['get', 'role'], 'origin']}
            paint={{
              'circle-radius': 6,
              'circle-color': '#ffffff',
              'circle-stroke-color': '#06b6d4',
              'circle-stroke-width': 2.5,
            }}
          />
          {/* Labels (Départ / Cible) */}
          <Layer
            id="convoy-labels"
            type="symbol"
            layout={{
              'text-field': ['get', 'label'],
              'text-size': 11,
              'text-offset': [0, 1.8],
              'text-anchor': 'top',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            }}
            paint={{
              'text-color': '#ffffff',
              'text-halo-color': '#0c4a6e',
              'text-halo-width': 1.5,
            }}
          />
        </Source>
      )}

      {/* Popup village retiré — uniquement l'overlay flottant en bas-droite
          (composant React HTML pur, indépendant de Mapbox).
          Le Popup Mapbox + le re-render simultané faisaient parfois
          rester le canvas vide → 'écran noir' avec popup seul visible. */}

      {waterPopup && (
        <Popup
          longitude={waterPopup.lng}
          latitude={waterPopup.lat}
          anchor="bottom"
          offset={12}
          closeButton={true}
          onClose={() => setWaterPopup(null)}
          className="text-gray-900"
        >
          <div className="text-sm space-y-0.5 min-w-[180px]">
            <div className="font-bold">
              {waterPopup.name || KIND_LABELS[waterPopup.kind] || 'Point d’eau'}
            </div>
            <div className="text-xs opacity-70">
              Type : {KIND_LABELS[waterPopup.kind] || waterPopup.kind}
            </div>
            {waterPopup.drinkable && (
              <div className="text-xs">
                Potable : <span className="font-medium">{waterPopup.drinkable}</span>
              </div>
            )}
            {waterPopup.status && (
              <div className="text-xs">
                Statut : <span className="font-medium">{waterPopup.status}</span>
              </div>
            )}
            <div className="text-[10px] opacity-50 pt-1">Source : {waterPopup.source}</div>
          </div>
        </Popup>
      )}
    </Map>

    {/* ───── Légende flottante (vue nationale uniquement) ─────
         Trois entrées : urgence / référence positive / infrastructure.
         Disparaît en mode drill-down. */}
    {!selectedWilaya && showVillages && (
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/85 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl p-4 text-white text-xs max-w-[260px] pointer-events-none">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60 mb-2">
          Lecture de la carte
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-[#dc2626] border border-white shrink-0" />
            <div>
              <div className="font-semibold leading-tight">30 priorités urgentes</div>
              <div className="text-white/60 text-[11px] leading-tight">villages les plus éloignés d'un point d'eau</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-[#16a34a] border border-white shrink-0" />
            <div>
              <div className="font-semibold leading-tight">Villages desservis</div>
              <div className="text-white/60 text-[11px] leading-tight">déjà sur le réseau d'eau potable (référence)</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-block w-4 h-5 shrink-0 flex items-center justify-center">
              <span className="block w-3 h-4 rounded-b-full bg-gradient-to-b from-cyan-300 to-cyan-700 border border-white/70" />
            </span>
            <div>
              <div className="font-semibold leading-tight">Points d'eau (cluster)</div>
              <div className="text-white/60 text-[11px] leading-tight">infrastructure existante par zone</div>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-white/40 mt-3 pt-2 border-t border-white/10">
          Cliquez sur une wilaya pour explorer tous ses villages.
        </div>
      </div>
    )}
    </>
  )
}

// React.memo : MapView ne re-render QUE si ses props changent vraiment.
// Comme selectedVillage n'est plus une prop (l'overlay est dans App.tsx),
// cliquer un village ne re-render plus du tout MapView → Mapbox ne
// touche pas au canvas → plus jamais d'écran 'noir' au clic village.
export default memo(MapView)
