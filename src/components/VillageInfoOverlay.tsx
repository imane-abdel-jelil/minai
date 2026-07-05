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
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import {
  recommendedDelay,
  statusColor,
  statusLabel,
  type VillageEval,
} from '../lib/villages'
import SignalIssueModal from './SignalIssueModal'

interface Props {
  village: Village | null
  ev: VillageEval | null
  onClose: () => void
  /** Utilisateur connecté (permet le bouton 'Signaler une erreur'). */
  user?: User | null
  organization?: string
}

export default function VillageInfoOverlay({
  village,
  ev,
  onClose,
  user,
  organization,
}: Props) {
  const [showSignal, setShowSignal] = useState(false)

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

        {/* Bouton signaler une erreur — disponible seulement si connecté */}
        {user && (
          <button
            onClick={() => setShowSignal(true)}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-medium text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-lg py-2 transition"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-3.5 h-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            Signaler une erreur sur ce village
          </button>
        )}
      </div>

      {/* Modal Signaler une erreur */}
      {showSignal && user && (
        <SignalIssueModal
          village={village}
          villageEval={ev}
          user={user}
          organization={organization || 'Water4All'}
          onClose={() => setShowSignal(false)}
          onCreated={() => {
            setShowSignal(false)
          }}
        />
      )}
    </div>
  )
}
