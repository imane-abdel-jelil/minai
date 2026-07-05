/**
 * VillageUpdatesInbox — vue admin des signalements crowdsourcés.
 *
 * Chantier 2 · brique validation. Liste les corrections village_updates
 * en status='pending' avec le contexte (village, champ concerné,
 * current vs proposed, motif, organisation soumettante). Permet à
 * l'admin de les approuver ou de les rejeter en un clic.
 *
 * Utilisé dans la page Rapports & export. L'idée : l'admin d'institution
 * (Ministère, MINAI ops) a un seul endroit centralisé pour toutes
 * les propositions de correction inter-organisations.
 *
 * Sans RBAC formel (arrive au chantier 3), tout utilisateur authentifié
 * peut techniquement approuver / rejeter. C'est intentionnel pour le
 * MVP démo — au chantier 3 on ajoutera la distinction admin/coordinator/agent.
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type VillageUpdate, type VillageUpdateStatus } from '../lib/supabase'

interface Props {
  user: User
}

const STATUS_META: Record<
  VillageUpdateStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending:     { label: 'En attente', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  approved:    { label: 'Approuvé',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:    { label: 'Rejeté',     bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  implemented: { label: 'Appliqué',   bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500' },
}

const FIELD_LABELS: Record<string, string> = {
  name_fr:              'Nom (FR)',
  name_ar:              'Nom (AR)',
  population_total:     'Population',
  distance_to_water_km: 'Distance au point d\'eau',
  reseau_aep:           'Réseau AEP',
  coordinates:          'Coordonnées GPS',
  moughataa:            'Moughataa',
  commune:              'Commune',
  other:                'Autre',
}

type Tab = 'pending' | 'all'

export default function VillageUpdatesInbox({ user }: Props) {
  const [updates, setUpdates] = useState<VillageUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchUpdates = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('village_updates')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(100)
    if (error) {
      console.warn('Erreur chargement village_updates :', error.message)
    }
    setUpdates((data as VillageUpdate[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUpdates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (tab === 'pending') return updates.filter((u) => u.status === 'pending')
    return updates
  }, [updates, tab])

  const counts = useMemo(() => {
    return {
      pending:     updates.filter((u) => u.status === 'pending').length,
      approved:    updates.filter((u) => u.status === 'approved').length,
      rejected:    updates.filter((u) => u.status === 'rejected').length,
      implemented: updates.filter((u) => u.status === 'implemented').length,
      total:       updates.length,
    }
  }, [updates])

  const handleReview = async (
    updateId: string,
    newStatus: 'approved' | 'rejected',
  ) => {
    if (!supabase) return
    setProcessingId(updateId)
    const { error } = await supabase
      .from('village_updates')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', updateId)
    setProcessingId(null)
    if (error) {
      console.warn('Erreur review :', error.message)
      return
    }
    fetchUpdates()
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header + tabs */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-slate-900 text-[16px] font-semibold flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                counts.pending > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            Corrections proposées par les partenaires
          </h2>
          <p className="text-slate-500 text-[12px] mt-0.5">
            Signalements crowdsourcés · à valider par un admin institutionnel
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-full">
          <TabButton
            active={tab === 'pending'}
            onClick={() => setTab('pending')}
            label="En attente"
            count={counts.pending}
          />
          <TabButton
            active={tab === 'all'}
            onClick={() => setTab('all')}
            label="Toutes"
            count={counts.total}
          />
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {tab === 'pending'
              ? 'Aucune correction en attente. Bravo aux équipes.'
              : 'Aucune correction signalée pour le moment.'}
          </div>
        ) : (
          filtered.map((u) => (
            <UpdateRow
              key={u.id}
              update={u}
              onApprove={() => handleReview(u.id, 'approved')}
              onReject={() => handleReview(u.id, 'rejected')}
              processing={processingId === u.id}
            />
          ))
        )}
      </div>
    </section>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[12px] font-medium transition flex items-center gap-1.5 ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
      <span
        className={`text-[10px] tabular-nums ${
          active ? 'text-slate-400' : 'text-slate-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function UpdateRow({
  update,
  onApprove,
  onReject,
  processing,
}: {
  update: VillageUpdate
  onApprove: () => void
  onReject: () => void
  processing: boolean
}) {
  const status = STATUS_META[update.status]
  const fieldLabel = FIELD_LABELS[update.field_name] || update.field_name

  return (
    <div className="px-5 py-4 hover:bg-slate-50 transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {/* Village + champ */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-slate-900">
              {update.village_name}
            </span>
            {update.village_wilaya && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[12px] text-slate-500">
                  {update.village_wilaya}
                </span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded uppercase tracking-wider">
              {fieldLabel}
            </span>
          </div>

          {/* Valeur actuelle → proposée */}
          <div className="flex items-center gap-2 mt-2 text-[13px] flex-wrap">
            <div className="text-slate-500">
              {update.current_value ? (
                <>
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider mr-1.5">
                    Actuel
                  </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    {update.current_value}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 italic">
                  (valeur actuelle non disponible)
                </span>
              )}
            </div>
            <span className="text-slate-400">→</span>
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider mr-1.5">
                Proposé
              </span>
              <span className="font-mono bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded text-sky-800 font-medium">
                {update.proposed_value}
              </span>
            </div>
          </div>

          {/* Motif */}
          {update.reason && (
            <div className="text-[12px] text-slate-600 mt-2 italic border-l-2 border-slate-200 pl-2.5">
              {update.reason}
            </div>
          )}

          {/* Erreur d'auto-apply éventuelle (review_notes) */}
          {update.review_notes && update.review_notes.includes('AUTO-APPLY ÉCHOUÉ') && (
            <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded mt-2 px-2 py-1.5">
              <span className="font-semibold">Auto-application impossible :</span>{' '}
              <span className="font-mono">
                {update.review_notes.split('AUTO-APPLY ÉCHOUÉ')[1]?.split(']')[1]?.trim() ||
                  update.review_notes}
              </span>
            </div>
          )}

          {/* Meta */}
          <div className="text-[11px] text-slate-500 mt-2.5">
            Proposé par{' '}
            <span className="font-medium text-slate-700">
              {update.submitted_by_organization || 'Organisation inconnue'}
            </span>{' '}
            · {formatRelativeDate(update.submitted_at)}
            {update.reviewed_at && (
              <>
                {' '}· revu {formatRelativeDate(update.reviewed_at)}
              </>
            )}
            {update.implemented_at && (
              <>
                {' '}·{' '}
                <span className="text-sky-700 font-medium">
                  appliqué automatiquement {formatRelativeDate(update.implemented_at)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions ou badge statut */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 ${status.bg} ${status.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {update.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={onReject}
                disabled={processing}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                Rejeter
              </button>
              <button
                onClick={onApprove}
                disabled={processing}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                {processing ? '…' : 'Approuver'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "aujourd'hui"
  if (diff === 1) return 'hier'
  if (diff < 7) return `il y a ${diff} j`
  if (diff < 30) return `il y a ${Math.floor(diff / 7)} sem`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
