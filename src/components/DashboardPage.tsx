/**
 * DashboardPage — dashboard complet MINAI (mockup Water4All).
 *
 * Layout dark futuriste inspiré du mockup fourni par Imane :
 *   - Sidebar de navigation (gauche, fixe)
 *   - Main content (droite, scrollable) :
 *     · Header (Dashboard + Bienvenue + CTA + notif + user)
 *     · 4 tuiles métriques (% évolution vs mois précédent)
 *     · Row 1 : Table ravitaillements récents | Carte interactive
 *     · Row 2 : Line chart évolution | Donut répartition | Top villages
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Supply, type OrganizationType } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import AddSupplyModal from './AddSupplyModal'
import SuppliesMapCard from './SuppliesMapCard'
import DashboardSidebar, { type NavKey } from './DashboardSidebar'
import { DonutChart, LineChart, TopVillagesList } from './DashboardCharts'

interface Props {
  user: User
  villageEvals: VillageEval[]
  onOpenMap: () => void
  onSignOut: () => void
}

// ─── Metadata visuelle ───────────────────────────────────────────────

const STATUS_META: Record<Supply['status'], { label: string; hex: string; bgClass: string; textClass: string }> = {
  delivered:   { label: 'Livré',    hex: '#10b981', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-300' },
  in_progress: { label: 'En cours', hex: '#f59e0b', bgClass: 'bg-amber-500/15',   textClass: 'text-amber-300'   },
  delayed:     { label: 'Retardé',  hex: '#ef4444', bgClass: 'bg-red-500/15',     textClass: 'text-red-300'     },
}

const ORG_TYPE_LABEL: Record<OrganizationType, string> = {
  ngo: 'ONG',
  un_agency: 'Agence ONU',
  red_crescent: 'Croissant-Rouge',
  institution: 'Institution',
}

// ─── Composant principal ─────────────────────────────────────────────

export default function DashboardPage({ user, villageEvals, onOpenMap, onSignOut }: Props) {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loadingSupplies, setLoadingSupplies] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [nav, setNav] = useState<NavKey>('dashboard')

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    'Partenaire'
  const organization =
    (user.user_metadata?.organization as string | undefined) || 'Water4All'
  const orgType: OrganizationType = 'ngo'

  // ─── Chargement Supabase ─────────────────────────────────────────
  const fetchSupplies = async () => {
    if (!supabase) {
      setLoadingSupplies(false)
      return
    }
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('supply_date', { ascending: false })
      .limit(200)
    if (error) console.warn('Erreur chargement supplies :', error.message)
    setSupplies((data as Supply[]) || [])
    setLoadingSupplies(false)
  }
  useEffect(() => {
    fetchSupplies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Sur clic nav ────────────────────────────────────────────────
  const handleNav = (k: NavKey) => {
    if (k === 'map') {
      onOpenMap()
      return
    }
    setNav(k)
  }

  // ─── Segmentation temporelle (ce mois / mois précédent) ─────────
  const { thisMonth, lastMonth } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const thisMonth: Supply[] = []
    const lastMonth: Supply[] = []
    for (const s of supplies) {
      const d = new Date(s.supply_date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth.push(s)
      } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
        lastMonth.push(s)
      }
    }
    return { thisMonth, lastMonth }
  }, [supplies])

  // ─── Métriques ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const volumeThis = thisMonth.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const volumeLast = lastMonth.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const countThis = thisMonth.length
    const countLast = lastMonth.length
    const villagesThis = new Set(thisMonth.map((s) => s.village_code_localite ?? s.village_name)).size
    const villagesLast = new Set(lastMonth.map((s) => s.village_code_localite ?? s.village_name)).size

    // Statuts (ce mois)
    const statuses = { delivered: 0, in_progress: 0, delayed: 0 }
    for (const s of thisMonth) statuses[s.status]++

    return {
      volumeThis,
      volumeChangePct: pctChange(volumeThis, volumeLast),
      countThis,
      countChangePct: pctChange(countThis, countLast),
      villagesThis,
      villagesChangePct: pctChange(villagesThis, villagesLast),
      statuses,
    }
  }, [thisMonth, lastMonth])

  // ─── Impact global (toutes orgs, cumulatif) ─────────────────────
  const globalImpact = useMemo(() => {
    const totalVolume = supplies.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const totalSupplies = supplies.length
    const villagesCovered = new Set(
      supplies.map((s) => s.village_code_localite ?? s.village_name),
    ).size
    return { totalVolume, totalSupplies, villagesCovered }
  }, [supplies])

  // ─── Line chart : évolution volume par mois (6 derniers) ────────
  const timelinePoints = useMemo(() => {
    const now = new Date()
    const months: { label: string; value: number; key: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        value: 0,
      })
    }
    for (const s of supplies) {
      const d = new Date(s.supply_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const m = months.find((x) => x.key === key)
      if (m) m.value += Number(s.quantity_m3)
    }
    return months.map((m) => ({ label: m.label, value: m.value }))
  }, [supplies])

  // ─── Répartition statut (donut, sur toute la data) ──────────────
  const statusDistribution = useMemo(() => {
    const stat = { delivered: 0, in_progress: 0, delayed: 0 }
    for (const s of supplies) stat[s.status]++
    return stat
  }, [supplies])

  // ─── Top villages par volume livré ──────────────────────────────
  const topVillages = useMemo(() => {
    const byVillage = new Map<string, { name: string; value: number }>()
    for (const s of supplies) {
      const key = String(s.village_code_localite ?? s.village_name)
      const cur = byVillage.get(key)
      const add = Number(s.quantity_m3)
      if (cur) cur.value += add
      else byVillage.set(key, { name: s.village_name, value: add })
    }
    return Array.from(byVillage.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [supplies])

  // ─── Ravitaillements récents (5) ────────────────────────────────
  const recentSupplies = supplies.slice(0, 5)

  return (
    <div
      className="min-h-screen w-screen bg-[#070b0f] text-white flex"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ══════ SIDEBAR ══════ */}
      <DashboardSidebar
        active={nav}
        onNavigate={handleNav}
        globalImpact={globalImpact}
      />

      {/* ══════ MAIN ══════ */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
          {/* ── Header ── */}
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-white text-[26px] font-bold tracking-tight leading-none">
                Dashboard
              </h1>
              <p className="text-white/60 text-[14px] mt-1.5">
                Bienvenue, {organization} <span className="inline-block ml-1">👋</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span className="text-base leading-none">+</span>
                Nouveau ravitaillement
              </button>

              {/* Notif */}
              <button className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition flex items-center justify-center" title="Notifications">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </button>

              {/* User pill */}
              <button
                onClick={onSignOut}
                className="flex items-center gap-2.5 pl-3 pr-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition"
                title="Cliquer pour se déconnecter"
              >
                <div className="text-right leading-tight">
                  <div className="text-white text-[13px] font-semibold">{organization}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">{ORG_TYPE_LABEL[orgType]}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[13px] font-bold">
                  {getInitials(organization)}
                </div>
              </button>
            </div>
          </header>

          {/* ── 4 Métriques ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Eau livrée"
              subLabel="(ce mois)"
              value={`${metrics.volumeThis.toLocaleString('fr-FR')} m³`}
              changePct={metrics.volumeChangePct}
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
                </svg>
              }
            />
            <MetricCard
              label="Ravitaillements"
              subLabel="(ce mois)"
              value={metrics.countThis.toString()}
              changePct={metrics.countChangePct}
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                </svg>
              }
            />
            <MetricCard
              label="Villages couverts"
              subLabel="(ce mois)"
              value={metrics.villagesThis.toString()}
              changePct={metrics.villagesChangePct}
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatusMetricCard statuses={metrics.statuses} />
          </section>

          {/* ── Row : Ravitaillements récents + Carte ── */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Recent supplies (2 cols) */}
            <div className="xl:col-span-2 bg-[#0e151b] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-white text-[15px] font-semibold">Ravitaillements récents</h2>
                <button
                  onClick={() => setNav('supplies')}
                  className="text-emerald-400 hover:text-emerald-300 text-[12px] font-medium"
                >
                  Voir tout
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-white/40 text-[11px] uppercase tracking-wider">
                      <th className="text-left px-5 py-2.5 font-medium">Village</th>
                      <th className="text-left px-2 py-2.5 font-medium">Wilaya</th>
                      <th className="text-right px-2 py-2.5 font-medium">Qté (m³)</th>
                      <th className="text-left px-2 py-2.5 font-medium">Date</th>
                      <th className="text-right px-5 py-2.5 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSupplies ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-white/40">Chargement…</td></tr>
                    ) : recentSupplies.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-white/40">Aucun ravitaillement.</td></tr>
                    ) : (
                      recentSupplies.map((s) => {
                        const st = STATUS_META[s.status]
                        return (
                          <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                            <td className="px-5 py-3 text-white">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.hex }} />
                                <span className="truncate">{s.village_name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-white/70">{s.village_wilaya}</td>
                            <td className="px-2 py-3 text-right text-white tabular-nums font-medium">{Number(s.quantity_m3).toLocaleString('fr-FR')}</td>
                            <td className="px-2 py-3 text-white/60">{formatDate(s.supply_date)}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${st.bgClass} ${st.textClass}`}>
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
            </div>

            {/* Map (3 cols) */}
            <div className="xl:col-span-3">
              <SuppliesMapCard
                supplies={supplies}
                villageEvals={villageEvals}
                organization={organization}
              />
            </div>
          </section>

          {/* ── Row : Line chart + Donut + Top villages ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Line chart */}
            <div className="bg-[#0e151b] border border-white/5 rounded-2xl p-5">
              <div className="mb-4">
                <h2 className="text-white text-[15px] font-semibold">Évolution des livraisons (m³)</h2>
                <p className="text-white/40 text-[11px] mt-0.5">6 derniers mois · toutes organisations</p>
              </div>
              <LineChart points={timelinePoints} color="#10b981" />
            </div>

            {/* Donut */}
            <div className="bg-[#0e151b] border border-white/5 rounded-2xl p-5">
              <div className="mb-4">
                <h2 className="text-white text-[15px] font-semibold">Répartition par statut</h2>
                <p className="text-white/40 text-[11px] mt-0.5">Tous ravitaillements confondus</p>
              </div>
              <div className="flex items-center gap-5">
                <DonutChart
                  segments={[
                    { label: 'Livrés',    value: statusDistribution.delivered,   color: STATUS_META.delivered.hex   },
                    { label: 'En cours',  value: statusDistribution.in_progress, color: STATUS_META.in_progress.hex },
                    { label: 'Retardés',  value: statusDistribution.delayed,     color: STATUS_META.delayed.hex     },
                  ]}
                />
                <div className="flex-1 space-y-2.5">
                  <DonutLegend color={STATUS_META.delivered.hex}   label="Livrés"    count={statusDistribution.delivered}   total={supplies.length} />
                  <DonutLegend color={STATUS_META.in_progress.hex} label="En cours"  count={statusDistribution.in_progress} total={supplies.length} />
                  <DonutLegend color={STATUS_META.delayed.hex}     label="Retardés"  count={statusDistribution.delayed}     total={supplies.length} />
                </div>
              </div>
            </div>

            {/* Top villages */}
            <div className="bg-[#0e151b] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white text-[15px] font-semibold">Top villages</h2>
                  <p className="text-white/40 text-[11px] mt-0.5">Quantité livrée cumulée</p>
                </div>
                <button
                  onClick={() => setNav('villages')}
                  className="text-emerald-400 hover:text-emerald-300 text-[12px] font-medium"
                >
                  Voir tout
                </button>
              </div>
              <TopVillagesList items={topVillages} />
            </div>
          </section>

          {/* Footer */}
          <p className="text-white/30 text-[11px] text-center pt-4 pb-8">
            MINAI · Plateforme d'intelligence géospatiale ·
            Données ANSADE RGPH-5 · UNICEF · Banque Mondiale
          </p>
        </div>
      </div>

      {/* ══════ MODAL AJOUT ══════ */}
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

// ─── Sous-composants ─────────────────────────────────────────────────

function MetricCard({
  label,
  subLabel,
  value,
  changePct,
  icon,
}: {
  label: string
  subLabel: string
  value: string
  changePct: number | null
  icon: React.ReactElement
}) {
  const isUp = changePct !== null && changePct >= 0
  return (
    <div className="bg-[#0e151b] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/60 text-[13px] font-medium">{label}</div>
          <div className="text-white/40 text-[11px]">{subLabel}</div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-white text-[28px] font-bold leading-none tracking-tight">
        {value}
      </div>
      {changePct !== null && (
        <div className={`mt-2.5 text-[12px] flex items-center gap-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          <span>{isUp ? '+' : ''}{changePct.toFixed(0)}% par rapport au mois dernier</span>
          <span>{isUp ? '↗' : '↘'}</span>
        </div>
      )}
      {changePct === null && (
        <div className="mt-2.5 text-[12px] text-white/40">Pas de comparaison disponible</div>
      )}
    </div>
  )
}

function StatusMetricCard({ statuses }: { statuses: { delivered: number; in_progress: number; delayed: number } }) {
  const total = statuses.delivered + statuses.in_progress + statuses.delayed
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  return (
    <div className="bg-[#0e151b] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/60 text-[13px] font-medium">Statut des opérations</div>
          <div className="text-white/40 text-[11px]">(ce mois)</div>
        </div>
        <DonutChart
          size={60}
          thickness={7}
          segments={[
            { label: 'l', value: statuses.delivered,   color: STATUS_META.delivered.hex   },
            { label: 'e', value: statuses.in_progress, color: STATUS_META.in_progress.hex },
            { label: 'r', value: statuses.delayed,     color: STATUS_META.delayed.hex     },
          ]}
        />
      </div>
      <div className="mt-3 space-y-1.5">
        <StatusLine color={STATUS_META.delivered.hex}   label="Livrés"    count={statuses.delivered}   pct={pct(statuses.delivered)} />
        <StatusLine color={STATUS_META.in_progress.hex} label="En cours"  count={statuses.in_progress} pct={pct(statuses.in_progress)} />
        <StatusLine color={STATUS_META.delayed.hex}     label="Retardés"  count={statuses.delayed}     pct={pct(statuses.delayed)} />
      </div>
    </div>
  )
}

function StatusLine({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-white/70">{label}</span>
      </div>
      <div className="text-white/60 tabular-nums">{count} ({pct}%)</div>
    </div>
  )
}

function DonutLegend({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-white/80">{label}</span>
      </div>
      <div className="text-white/60 tabular-nums">
        {pct}% <span className="text-white/40">({count})</span>
      </div>
    </div>
  )
}

// ─── Utils ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}
