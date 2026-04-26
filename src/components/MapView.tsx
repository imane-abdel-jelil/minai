import { useState, useMemo } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl } from 'react-map-gl'
import type { MapMouseEvent } from 'mapbox-gl'
import { MAURITANIA_REGIONS, type Region, getScoreColor } from '../data/mauritania-regions'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface Props {
  onRegionClick: (region: Region | null) => void
}

interface HoveredRegion {
  lng: number
  lat: number
  name: string
  score: number
}

export default function MapView({ onRegionClick }: Props) {
  const [hovered, setHovered] = useState<HoveredRegion | null>(null)

  // Construire un GeoJSON à partir des régions
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
          radius: 8 + Math.sqrt(r.ruralPopulation) / 60,
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
      interactiveLayerIds={['region-circles']}
      cursor={hovered ? 'pointer' : 'grab'}
      onClick={(e: MapMouseEvent) => {
        // @ts-expect-error react-map-gl ajoute features sur l'event
        const feature = e.features?.[0]
        if (feature) {
          const region = MAURITANIA_REGIONS.find((r) => r.id === feature.properties.id)
          if (region) onRegionClick(region)
        } else {
          onRegionClick(null)
        }
      }}
      onMouseMove={(e: MapMouseEvent) => {
        // @ts-expect-error react-map-gl ajoute features sur l'event
        const feature = e.features?.[0]
        if (feature) {
          const coords = (feature.geometry as GeoJSON.Point).coordinates
          setHovered({
            lng: coords[0],
            lat: coords[1],
            name: feature.properties.name,
            score: feature.properties.score,
          })
        } else if (hovered) {
          setHovered(null)
        }
      }}
    >
      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-right" />

      <Source id="regions" type="geojson" data={regionsGeoJSON}>
        <Layer
          id="region-circles"
          type="circle"
          paint={{
            'circle-radius': ['get', 'radius'],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          }}
        />
        <Layer
          id="region-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.6],
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
    </Map>
  )
}
