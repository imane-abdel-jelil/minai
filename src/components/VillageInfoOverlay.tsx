/**
 * Overlay flottant qui affiche les infos d'un village sélectionné.
 *
 * Indépendant de Mapbox (pas de Popup GL) et de la sidebar — c'est
 * un simple <div> en position:fixed dans l'arbre React, qui apparaît
 * en bas-droite au-dessus de la carte. Cliquer la croix le ferme.
 *
 * Pourquoi un overlay et pas un Popup Mapbox ?
 * Le Popup Mapbox forçait un re-render de la couche Mapbox au mount/
 * unmount, ce qui sur certains environnements faisait disparaître
 * brièvement les tuiles satellite. L'overlay HTML pur n'a aucune
 * interaction avec Mapbox — affichage 100% stable.
 */
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import {
  recommendedDelay,
  statusColor,
  statusLabel,
  type VillageEval,
} from '../lib/villages'

interface Props {
  village: Village | null
  ev: VillageEval | null
  onClose: () => void
}

export default function VillageInfoOverlay({ village, ev, onClose }: Props) {
  if (!village || !ev) return null

  const wilayaName =
    MAURITANIA_REGIONS.find((r) => r.id === village.wilayaId)?.name ??
    village.wilayaId ??
    '—'

  return (
    <div className="fixed bottom-6 right-6 z-30 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl text-gray-900 overflow-hidden border border-gray-200">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-lg leading-tight truncate">
              {village.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{wilayaName}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
              style={{
                background: `${statusColor(ev.status)}22`,
                color: statusColor(ev.status),
              }}
            >
              {statusLabel(ev.status)}
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              Population
            </div>
            <div className="font-semibold text-sm">
              {village.population.toLocaleString('fr-FR')} hab.
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              Point d'eau
            </div>
            <div className="font-semibold text-sm">
              {Number.isFinite(ev.distanceToWaterKm)
                ? `${ev.distanceToWaterKm.toFixed(1)} km`
                : '—'}
            </div>
          </div>
        </div>

        <div
          className="text-xs px-2.5 py-1.5 rounded font-medium"
          style={{
            background: `${statusColor(ev.status)}15`,
            color: statusColor(ev.status),
          }}
        >
          Intervention {recommendedDelay(ev.status)}
        </div>
      </div>
    </div>
  )
}
