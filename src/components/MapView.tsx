import { useState, useMemo, useEffect } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl, type MapLayerMouseEvent } from 'react-map-gl'
import { MAURITANIA_REGIONS, type Region, getScoreColor } from '../data/mauritania-regions'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface Props {
  onRegionClick: (region: Region | null) => void
  showWaterPoints: boolean
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

export default function MapView({ onRegionClick, showWaterPoints }: Props) {
  const [hovered, setHovered] = useState<HoveredRegion | null>(null)
  const [waterPopup, setWaterPopup] = useState<WaterPointPopup | null>(null)
  const [waterPoints, setWaterPoints] = useState<GeoJSON.FeatureCollection | null>(null)

  // Charger les points d'eau réels depuis public/data/water-points.geojson
  useEffect(() => {
    fetch('/data/water-points.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setWaterPoints(data)
      })
      .catch((e) => console.warn('Pas de données points d’eau :', e))
  }, [])

  // GeoJSON des wilayas (centroïdes)
  const regionsGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: MAURITANIA_REGIONS.map((r) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: r.center },
        properties: {
          id: r.id,
          name: r.name,
          score: r.waterAccessScore,
          color: getScoreColor(r.waterAccessScore),
          rural: r.ruralPopulation,
          radius: 14 + Math.sqrt(r.ruralPopulation) / 50,
        },
      })),
    }),
    []
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
        ...(showWaterPoints && waterPoints ? ['water-unclustered'] : []),
      ]}
      cursor={hovered || waterPopup ? 'pointer' : 'grab'}
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

      {/* ---------- Points d'eau réels (clusterisés) ---------- */}
      {showWaterPoints && waterPoints && (
        <Source
          id="water-points"
          type="geojson"
          data={waterPoints}
          cluster={true}
          clusterRadius={45}
          clusterMaxZoom={12}
        >
          {/* Clusters (bulles avec compteur) */}
          <Layer
            id="water-clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#06b6d4', 20,
                '#0ea5e9', 100,
                '#0284c7',
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                14, 20,
                20, 100,
                28,
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.85,
            }}
          />
          <Layer
            id="water-cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
          {/* Points individuels (couleur par type) */}
          <Layer
            id="water-unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': 5,
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
              'circle-opacity': 0.9,
            }}
          />
        </Source>
      )}

      {/* ---------- Wilayas (au-dessus des points d'eau) ---------- */}
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
