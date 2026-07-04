/**
 * SuppliesMapCard — carte interactive Mauritanie des ravitaillements
 * enregistrés par les organisations partenaires.
 *
 * Un plus visuel au dashboard : style sombre satellite, marqueurs
 * colorés par statut avec halo pulse subtil, tooltip flottant au
 * survol qui affiche village + wilaya + quantité + date + org.
 *
 * Touche 'futuriste' :
 *   - carte Mapbox dark-v11 (rendu élégant, contraste doux)
 *   - marqueurs SVG avec halo animé
 *   - tooltip glass-morphism (backdrop-blur + border blanc/10)
 *   - filtres pill segmented control
 *
 * Résiste à un dashboard clair : le card lui-même est sombre, comme
 * un "écran de contrôle" incrusté dans l'interface propre.
 */
import { useMemo, useRef, useState } from 'react'
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl'
import type { VillageEval } from '../lib/villages'
import type { Supply } from '../lib/supabase'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// ─── Metadata visuelle ───────────────────────────────────────────────

const STATUS_MAPBOX_COLOR: Record<Supply['status'], string> = {
  delivered: '#0ea5e9',    // sky-500 (blue = livré)
  in_progress: '#f59e0b',  // amber-500
  delayed: '#ef4444',      // red-500
  planned: '#8b5cf6',      // violet-500 (planifié)
}

const STATUS_META: Record<Supply['status'], { label: string; color: string }> = {
  delivered:   { label: 'Livré',    color: '#0ea5e9' },
  in_progress: { label: 'En cours', color: '#f59e0b' },
  delayed:     { label: 'Reporté',  color: '#ef4444' },
  planned:     { label: 'Planifié', color: '#8b5cf6' },
}

type Filter = 'all' | Supply['status']

interface Props {
  supplies: Supply[]
  villageEvals: VillageEval[]
  organization: string
}

interface HoverInfo {
  x: number
  y: number
  supply: Supply
}

export default function SuppliesMapCard({ supplies, villageEvals, organization }: Props) {
  const mapRef = useRef<MapRef | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [hover, setHover] = useState<HoverInfo | null>(null)

  // ─── Convertit les supplies en FeatureCollection GeoJSON ───────────
  const geojson = useMemo<GeoJSON.FeatureCollection>(() => {
    const features = supplies
      .filter((s) => filter === 'all' || s.status === filter)
      .map((s) => {
        // Retrouver les coordonnées du village via village_code_localite
        const v = villageEvals.find(
          (ev) => ev.village.id === String(s.village_code_localite ?? ''),
        )
        if (!v) return null
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: v.village.center,
          },
          properties: {
            id: s.id,
            village_name: s.village_name,
            village_wilaya: s.village_wilaya,
            organization: s.organization,
            quantity_m3: s.quantity_m3,
            supply_date: s.supply_date,
            status: s.status,
            notes: s.notes,
            color: STATUS_MAPBOX_COLOR[s.status],
            is_mine: s.organization === organization ? 1 : 0,
          },
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
    return { type: 'FeatureCollection', features }
  }, [supplies, villageEvals, filter, organization])

  // ─── Compteurs pour les filtres ────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: supplies.length,
      delivered:   supplies.filter((s) => s.status === 'delivered').length,
      planned:     supplies.filter((s) => s.status === 'planned').length,
      in_progress: supplies.filter((s) => s.status === 'in_progress').length,
      delayed:     supplies.filter((s) => s.status === 'delayed').length,
    }
  }, [supplies])

  // ─── Hover Mapbox ──────────────────────────────────────────────────
  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      setHover(null)
      return
    }
    const p = feature.properties
    if (!p) return
    setHover({
      x: e.point.x,
      y: e.point.y,
      supply: {
        id: p.id,
        organization: p.organization,
        organization_type: 'ngo', // arbitraire, pas utilisé dans tooltip
        village_code_localite: null,
        village_name: p.village_name,
        village_wilaya: p.village_wilaya,
        quantity_m3: Number(p.quantity_m3),
        supply_date: p.supply_date,
        status: p.status,
        notes: p.notes || null,
        created_by: null,
        created_at: '',
      } as Supply,
    })
  }

  const handleMouseLeave = () => setHover(null)

  if (!MAPBOX_TOKEN) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-white/60 text-sm text-center">
        Token Mapbox manquant.
      </div>
    )
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header clair */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-gradient-to-b from-sky-50/50 to-white">
        <div>
          <h2 className="text-slate-900 font-semibold text-[16px] tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Carte des ravitaillements
          </h2>
          <p className="text-slate-500 text-[12px] mt-0.5">
            Survolez un point pour voir le détail de l'opération
          </p>
        </div>
        <FilterBar counts={counts} value={filter} onChange={setFilter} />
      </div>

      {/* Carte */}
      <div className="relative h-[420px]">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude: -10, latitude: 19.5, zoom: 4.7 }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={['supplies-dot']}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          cursor={hover ? 'pointer' : 'default'}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Source id="supplies" type="geojson" data={geojson}>
            {/* Halo pulsant (grand cercle translucide) */}
            <Layer
              id="supplies-halo"
              source="supplies"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  4, 12, 8, 20, 12, 28,
                ],
                'circle-color': ['get', 'color'],
                'circle-opacity': 0.18,
                'circle-blur': 0.6,
              }}
            />
            {/* Anneau plus dense */}
            <Layer
              id="supplies-ring"
              source="supplies"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  4, 7, 8, 10, 12, 14,
                ],
                'circle-color': 'transparent',
                'circle-stroke-color': ['get', 'color'],
                'circle-stroke-width': 1.5,
                'circle-stroke-opacity': 0.7,
              }}
            />
            {/* Point central plein */}
            <Layer
              id="supplies-dot"
              source="supplies"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  4, 4, 8, 6, 12, 9,
                ],
                'circle-color': ['get', 'color'],
                'circle-stroke-color': '#0f172a',
                'circle-stroke-width': 1.5,
                'circle-opacity': 1,
              }}
            />
          </Source>
        </Map>

        {/* Tooltip flottant au survol */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
              transform:
                hover.x > 400 ? 'translateX(calc(-100% - 24px))' : undefined,
            }}
          >
            <SupplyTooltip supply={hover.supply} organization={organization} />
          </div>
        )}

        {/* Légende en bas-gauche */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full px-3.5 py-1.5 shadow-md">
          <LegendItem color={STATUS_META.delivered.color} label="Livré" />
          <LegendItem color={STATUS_META.planned.color} label="Planifié" />
          <LegendItem color={STATUS_META.in_progress.color} label="En cours" />
          <LegendItem color={STATUS_META.delayed.color} label="Reporté" />
        </div>
      </div>
    </section>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────

function FilterBar({
  counts,
  value,
  onChange,
}: {
  counts: { all: number; delivered: number; planned: number; in_progress: number; delayed: number }
  value: Filter
  onChange: (f: Filter) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-full">
      <FilterPill
        active={value === 'all'}
        onClick={() => onChange('all')}
        label="Tous"
        count={counts.all}
      />
      <FilterPill
        active={value === 'delivered'}
        onClick={() => onChange('delivered')}
        label="Livrés"
        count={counts.delivered}
        dotColor={STATUS_META.delivered.color}
      />
      <FilterPill
        active={value === 'planned'}
        onClick={() => onChange('planned')}
        label="Planifiés"
        count={counts.planned}
        dotColor={STATUS_META.planned.color}
      />
      <FilterPill
        active={value === 'in_progress'}
        onClick={() => onChange('in_progress')}
        label="En cours"
        count={counts.in_progress}
        dotColor={STATUS_META.in_progress.color}
      />
      <FilterPill
        active={value === 'delayed'}
        onClick={() => onChange('delayed')}
        label="Reportés"
        count={counts.delayed}
        dotColor={STATUS_META.delayed.color}
      />
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  dotColor,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  dotColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1.5 ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {dotColor && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />}
      {label}
      <span className={`text-[10px] tabular-nums ${active ? 'text-slate-400' : 'text-slate-400'}`}>
        {count}
      </span>
    </button>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-slate-600 text-[11px]">{label}</span>
    </div>
  )
}

function SupplyTooltip({ supply, organization }: { supply: Supply; organization: string }) {
  const status = STATUS_META[supply.status]
  const isMine = supply.organization === organization
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-3.5 w-[240px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-slate-900 font-semibold text-[14px] truncate">
            {supply.village_name}
          </div>
          <div className="text-slate-500 text-[11px]">{supply.village_wilaya}</div>
        </div>
        <span
          className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{
            background: `${status.color}22`,
            color: status.color,
          }}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
        <TooltipRow label="Quantité" value={`${Number(supply.quantity_m3).toLocaleString('fr-FR')} m³`} />
        <TooltipRow label="Date" value={formatDate(supply.supply_date)} />
        <TooltipRow
          label="Livré par"
          value={supply.organization}
          highlight={isMine}
        />
      </div>
      {supply.notes && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 italic">
          {supply.notes}
        </div>
      )}
    </div>
  )
}

function TooltipRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400 text-[11px] uppercase tracking-wider">{label}</span>
      <span
        className={`text-[12px] font-medium tabular-nums ${
          highlight ? 'text-sky-600' : 'text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
