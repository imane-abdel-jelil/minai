import { useState, useMemo, useEffect } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl, type MapLayerMouseEvent } from 'react-map-gl'
import { MAURITANIA_REGIONS, type Region, getScoreColor } from '../data/mauritania-regions'
import { countPointsByWilaya, type WilayaStats } from '../lib/geo'
import type { ComputedScore } from '../lib/score'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface Props {
  onRegionClick: (region: Region | null) => void
  showWaterPoints: boolean
  showWilayas: boolean
  onStatsReady?: (stats: Record<string, WilayaStats>) => void
  kindFilters: Record<string, boolean>
  computedScores: Record<string, ComputedScore>
}

interface HoveredRegion {
  lng: number
  lat: number
  name: string
  score: number
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

export default function MapView({ onRegionClick, showWaterPoints, showWilayas, onStatsReady, kindFilters, computedScores }: Props) {
  const [hovered, setHovered] = useState<HoveredRegion | null>(null)
  const [waterPopup, setWaterPopup] = useState<WaterPointPopup | null>(null)
  const [waterPoints, setWaterPoints] = useState<GeoJSON.FeatureCollection | null>(null)
  const [wilayasGeo, setWilayasGeo] = useState<GeoJSON.FeatureCollection | null>(null)

  // Charger les points d'eau réels depuis public/data/water-points.geojson
  useEffect(() => {
    fetch('/data/water-points.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setWaterPoints(data)
      })
      .catch((e) => console.warn('Pas de données points d’eau :', e))
  }, [])

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

  // GeoJSON des wilayas (centroïdes) — utilise les scores live
  const regionsGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: MAURITANIA_REGIONS.map((r) => {
        const live = computedScores[r.id]
        const score = live?.score ?? r.waterAccessScore
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: r.center },
          properties: {
            id: r.id,
            name: r.name,
            score,
            color: live?.color ?? getScoreColor(score),
            rural: r.ruralPopulation,
            radius: 14 + Math.sqrt(r.ruralPopulation) / 50,
          },
        }
      }),
    }),
    [computedScores]
  )

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
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: -10.94, latitude: 20.27, zoom: 4.8 }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={[
        'region-circles',
        ...(showWilayas && enrichedWilayas ? ['wilaya-fill'] : []),
        ...(showWaterPoints && filteredWaterPoints ? ['water-unclustered'] : []),
      ]}
      cursor={hovered || waterPopup ? 'pointer' : 'grab'}
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
          setWaterPopup(null)
          return
        }
        if (feature.layer && feature.layer.id === 'region-circles') {
          const region = MAURITANIA_REGIONS.find((r) => r.id === feature.properties!.id)
          if (region) onRegionClick(region)
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
      onMouseMove={(e: MapLayerMouseEvent) => {
        const feature = e.features?.find((f) => f.layer?.id === 'region-circles')
        if (feature?.properties) {
          const coords = (feature.geometry as GeoJSON.Point).coordinates
          setHovered({
            lng: coords[0],
            lat: coords[1],
            name: feature.properties.name as string,
            score: feature.properties.score as number,
          })
        } else if (hovered) {
          setHovered(null)
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
          {/* Clusters → grosses gouttes bleues avec compteur dedans */}
          <Layer
            id="water-clusters"
            type="symbol"
            filter={['has', 'point_count']}
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
                0.55, 20,
                0.78, 100,
                1.0,
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
                14, 100,
                16,
              ],
              'text-anchor': 'center',
              'text-offset': [0, -1.0],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            }}
            paint={{
              'text-color': '#ffffff',
              'text-halo-color': '#0c4a6e',
              'text-halo-width': 1.4,
            }}
          />
          {/* Points individuels — petits cercles, seulement quand on zoome proche */}
          <Layer
            id="water-unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            minzoom={8}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
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

      {/* ---------- Wilayas (centroïdes — toujours au-dessus) ---------- */}
      <Source id="regions" type="geojson" data={regionsGeoJSON}>
        <Layer
          id="region-circles"
          type="circle"
          paint={{
            'circle-radius': ['get', 'radius'],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.92,
          }}
        />
        <Layer
          id="region-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, 1.8],
            'text-anchor': 'top',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          }}
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
          }}
        />
      </Source>

      {hovered && (
        <Popup
          longitude={hovered.lng}
          latitude={hovered.lat}
          anchor="bottom"
          offset={20}
          closeButton={false}
          className="text-gray-900"
        >
          <div className="text-sm">
            <div className="font-bold">{hovered.name}</div>
            <div className="text-xs opacity-70">Score : {hovered.score}/100</div>
          </div>
        </Popup>
      )}

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
  )
}
