/**
 * SuppliesPage — page 'Ravitaillements' du dashboard MINAI.
 *
 * Vue opérationnelle centralisée pour les partenaires ONG :
 *   1. Header + CTA 'Nouveau ravitaillement'
 *   2. Métriques rapides (livrés / planifiés / en cours / retardés)
 *   3. Tableau complet des supplies (multi-org, filtres statut + org)
 *   4. Inbox des corrections crowdsourcées (VillageUpdatesInbox)
 *
 * Note : les corrections sont ici (et non dans Rapports) parce que
 * l'utilisatrice cible = coordinatrice logistique. Sur cette page
 * elle gère les convois de ravitaillement ET valide les propositions
 * terrain — un seul écran opérationnel plutôt que deux.
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Supply, type OrganizationType } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import AddSupplyModal from './AddSupplyModal'
import VillageUpdatesInbox from './VillageUpdatesInbox'

interface Props {
  user: User
  villageEvals: VillageEval[]
}

// ─── Meta visuelle ────────────────────────────────────────────────────

const STATUS_META: Record<
  Supply['status'],
  { label: string; hex: string; bgClass: string; textClass: string }
> = {
  delivered:   { label: 'Livré',    hex: '#0ea5e9', bgClass: 'bg-sky-50',    textClass: 'text-sky-700' },
  planned:     { label: 'Planifié', hex: '#8b5cf6', bgClass: 'bg-violet-50', textClass: 'text-violet-700' },
  in_progress: { label: 'En cours', hex: '#f59e0b', bgClass: 'bg-amber-50',  textClass: 'text-amber-700' },
  delayed:     { label: 'Retardé',  hex: '#ef4444', bgClass: 'bg-red-50',    textClass: 'text-red-700' },
}

const ORG_TYPE_LABEL: Record<OrganizationType, string> = {
  ngo: 'ONG',
  un_agency: 'Agence ONU',
  red_crescent: 'Croissant-Rouge',
  institution: 'Institution',
}

type StatusFilter = 'all' | Supply['status']
type OrgFilter = 'all' | 'mine'

export default function SuppliesPage({ user, villageEvals }: Props) {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('all')

  const organization =
    (user.user_metadata?.organization as string | undefined) || 'Water4All'

  // ─── Chargement ─────────────────────────────────────────────────────
  const fetchSupplies = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('supply_date', { ascending: false })
      .limit(200)
    if (error) console.warn('Erreur chargement supplies :', error.message)
    setSupplies((data as Supply[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSupplies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Filtrage ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return supplies.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (orgFilter === 'mine' && s.organization !== organization) return false
      return true
    })
  }, [supplies, statusFilter, orgFilter, organization])

  // ─── Compteurs métriques ────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      total: supplies.length,
      delivered: supplies.filter((s) => s.status === 'delivered').length,
      planned: supplies.filter((s) => s.status === 'planned').length,
      in_progress: supplies.filter((s) => s.status === 'in_progress').length,
      delayed: supplies.filter((s) => s.status === 'delayed').length,
      mine: supplies.filter((s) => s.organization === organization).length,
    }
  }, [supplies, organization])

  // Distance calc helper
  const distanceFor = (codeLocalite: number | null): number | null => {
    if (codeLocalite == null) return null
    const v = villageEvals.find((ev) => ev.village.id === String(codeLocalite))
    return v?.distanceToWaterKm ?? null
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight leading-none">
            Ravitaillements
          </h1>
          <p className="text-slate-500 text-[14px] mt-1.5">
            Vue centralisée des opérations enregistrées par tous les partenaires
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
        >
          <span className="text-base leading-none">+</span>
          Nouveau ravitaillement
        </button>
      </header>

      {/* ── Métriques rapides ── */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricPill label="Total" count={counts.total} color="slate" />
        <MetricPill label="Livrés" count={counts.delivered} color="sky" />
        <MetricPill label="Planifiés" count={counts.planned} color="violet" />
        <MetricPill label="En cours" count={counts.in_progress} color="amber" />
        <MetricPill label="Retardés" count={counts.delayed} color="red" />
      </section>

      {/* ── Filtres ── */}
      <div className="flex items-center gap-4 flex-wrap bg-white border border-slate-200 rounded-2xl px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Statut
          </div>
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-full">
            <FilterPill
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label="Tous"
              count={counts.total}
            />
            <FilterPill
              active={statusFilter === 'delivered'}
              onClick={() => setStatusFilter('delivered')}
              label="Livrés"
              count={counts.delivered}
              dot={STATUS_META.delivered.hex}
            />
            <FilterPill
              active={statusFilter === 'planned'}
              onClick={() => setStatusFilter('planned')}
              label="Planifiés"
              count={counts.planned}
              dot={STATUS_META.planned.hex}
            />
            <FilterPill
              active={statusFilter === 'in_progress'}
              onClick={() => setStatusFilter('in_progress')}
              label="En cours"
              count={counts.in_progress}
              dot={STATUS_META.in_progress.hex}
            />
            <FilterPill
              active={statusFilter === 'delayed'}
              onClick={() => setStatusFilter('delayed')}
              label="Retardés"
              count={counts.delayed}
              dot={STATUS_META.delayed.hex}
            />
          </div>
        </div>

        <div className="border-l border-slate-200 pl-4 h-full">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Organisation
          </div>
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-full">
            <FilterPill
              active={orgFilter === 'all'}
              onClick={() => setOrgFilter('all')}
              label="Toutes"
              count={counts.total}
            />
            <FilterPill
              active={orgFilter === 'mine'}
              onClick={() => setOrgFilter('mine')}
              label={organization}
              count={counts.mine}
            />
          </div>
        </div>
      </div>

      {/* ── Table des supplies ── */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-[15px]">
              Opérations enregistrées
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {filtered.length.toLocaleString('fr-FR')} résultat
              {filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50">
                <th className="text-left px-5 py-2.5 font-semibold">Village</th>
                <th className="text-left px-2 py-2.5 font-semibold">Wilaya</th>
                <th className="text-right px-2 py-2.5 font-semibold">Point d'eau</th>
                <th className="text-right px-2 py-2.5 font-semibold">Qté (m³)</th>
                <th className="text-left px-2 py-2.5 font-semibold">Date</th>
                <th className="text-left px-2 py-2.5 font-semibold">Organisation</th>
                <th className="text-right px-5 py-2.5 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Aucun ravitaillement ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const st = STATUS_META[s.status]
                  const isMine = s.organization === organization
                  const dist = distanceFor(s.village_code_localite)
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: st.hex }}
                          />
                          <span className="font-medium text-slate-900">
                            {s.village_name}
                          </span>
                          {isMine && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                              Vous
                            </span>
                          )}
                        </div>
                        {s.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md italic">
                            {s.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-slate-600">
                        {s.village_wilaya}
                      </td>
                      <td className="px-2 py-3 text-right text-slate-500 tabular-nums">
                        {dist != null ? `${dist.toFixed(1)} km` : '—'}
                      </td>
                      <td className="px-2 py-3 text-right text-slate-900 tabular-nums font-medium">
                        {Number(s.quantity_m3).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-2 py-3 text-slate-600">
                        {formatDate(s.supply_date)}
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-slate-700 font-medium truncate max-w-[180px]">
                          {s.organization}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {ORG_TYPE_LABEL[s.organization_type]}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${st.bgClass} ${st.textClass}`}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Inbox corrections crowdsourcées ── */}
      <VillageUpdatesInbox user={user} />

      {/* ══ MODAL AJOUT ══ */}
      {showAddModal && (
        <AddSupplyModal
          organization={organization}
          userId={user.id}
          villageEvals={villageEvals}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            fetchSupplies()
          }}
        />
      )}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────

function MetricPill({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: 'slate' | 'sky' | 'violet' | 'amber' | 'red'
}) {
  const colors = {
    slate:  { bg: 'bg-white',       border: 'border-slate-200',  text: 'text-slate-900',   accent: 'text-slate-500' },
    sky:    { bg: 'bg-sky-50',      border: 'border-sky-200',    text: 'text-sky-900',     accent: 'text-sky-700' },
    violet: { bg: 'bg-violet-50',   border: 'border-violet-200', text: 'text-violet-900',  accent: 'text-violet-700' },
    amber:  { bg: 'bg-amber-50',    border: 'border-amber-200',  text: 'text-amber-900',   accent: 'text-amber-700' },
    red:    { bg: 'bg-red-50',      border: 'border-red-200',    text: 'text-red-900',     accent: 'text-red-700' },
  }[color]
  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl px-4 py-3 flex items-baseline justify-between gap-2`}
    >
      <span className={`text-[12px] font-medium ${colors.accent}`}>{label}</span>
      <span className={`text-[22px] font-bold tabular-nums ${colors.text}`}>
        {count}
      </span>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  dot?: string
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
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      )}
      {label}
      <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
    </button>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
