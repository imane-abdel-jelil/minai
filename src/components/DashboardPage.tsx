/**
 * DashboardPage — dashboard MINAI (palette blanc + bleu ciel).
 *
 * Contient :
 *   - Sidebar de navigation
 *   - Header (titre + welcome + notif + user)
 *   - 4 tuiles métriques avec évolution vs mois précédent
 *   - Section 'Prochains ravitaillements planifiés' (multi-ONG)
 *   - Row : Ravitaillements récents (table) + Carte interactive
 *   - Row : Line chart évolution + Donut statuts + Top villages
 *
 * Chaque village est enrichi avec sa distance au point d'eau
 * (calculée depuis villageEvals).
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Supply, type OrganizationType } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import AddSupplyModal from './AddSupplyModal'
import SuppliesMapCard from './SuppliesMapCard'
import DashboardSidebar, { type NavKey } from './DashboardSidebar'
import { DonutChart, LineChart, TopVillagesList } from './DashboardCharts'
import ReportsPage from './ReportsPage'
import SuppliesPage from './SuppliesPage'

interface Props {
  user: User
  villageEvals: VillageEval[]
  onOpenMap: () => void
  onSignOut: () => void
}

// ─── Metadata visuelle ───────────────────────────────────────────────

const STATUS_META: Record<Supply['status'], { label: string; hex: string; bgClass: string; textClass: string; dotBg: string }> = {
  delivered:   { label: 'Livré',    hex: '#0ea5e9', bgClass: 'bg-sky-50',    textClass: 'text-sky-700',    dotBg: 'bg-sky-500'    },
  planned:     { label: 'Planifié', hex: '#8b5cf6', bgClass: 'bg-violet-50', textClass: 'text-violet-700', dotBg: 'bg-violet-500' },
  in_progress: { label: 'En cours', hex: '#f59e0b', bgClass: 'bg-amber-50',  textClass: 'text-amber-700',  dotBg: 'bg-amber-500'  },
  delayed:     { label: 'Retardé',  hex: '#ef4444', bgClass: 'bg-red-50',    textClass: 'text-red-700',    dotBg: 'bg-red-500'    },
}

const ORG_TYPE_LABEL: Record<OrganizationType, string> = {
  ngo: 'ONG',
  un_agency: 'Agence ONU',
  red_crescent: 'Croissant-Rouge',
  institution: 'Institution',
}

const ORG_TYPE_BG: Record<OrganizationType, string> = {
  ngo:          'bg-slate-100 text-slate-700',
  un_agency:    'bg-sky-100 text-sky-700',
  red_crescent: 'bg-red-100 text-red-700',
  institution:  'bg-slate-200 text-slate-800',
}

// ─── Composant principal ─────────────────────────────────────────────

export default function DashboardPage({ user, villageEvals, onOpenMap, onSignOut }: Props) {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loadingSupplies, setLoadingSupplies] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [nav, setNav] = useState<NavKey>('dashboard')

  const organization =
    (user.user_metadata?.organization as string | undefined) || 'Water4All'
  const orgType: OrganizationType = 'ngo'

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

  const handleNav = (k: NavKey) => {
    if (k === 'map') {
      onOpenMap()
      return
    }
    setNav(k)
  }

  // Helper : distance au point d'eau pour un village_code_localite donné
  const distanceForVillage = (codeLocalite: number | null): number | null => {
    if (codeLocalite == null) return null
    const v = villageEvals.find((ev) => ev.village.id === String(codeLocalite))
    return v?.distanceToWaterKm ?? null
  }

  // ─── Segmentation temporelle ─────────────────────────────────────
  const { thisMonth, lastMonth, upcoming, past } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const thisMonth: Supply[] = []
    const lastMonth: Supply[] = []
    const upcoming: Supply[] = []
    const past: Supply[] = []
    for (const s of supplies) {
      const d = new Date(s.supply_date)
      d.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (s.status === 'planned' || d.getTime() > today.getTime()) {
        upcoming.push(s)
      } else {
        past.push(s)
      }
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth.push(s)
      } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
        lastMonth.push(s)
      }
    }
    // upcoming trié par date croissante (le prochain en premier)
    upcoming.sort((a, b) => new Date(a.supply_date).getTime() - new Date(b.supply_date).getTime())
    return { thisMonth, lastMonth, upcoming, past }
  }, [supplies])

  const metrics = useMemo(() => {
    const nonPlannedThis = thisMonth.filter((s) => s.status !== 'planned')
    const nonPlannedLast = lastMonth.filter((s) => s.status !== 'planned')
    const volumeThis = nonPlannedThis.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const volumeLast = nonPlannedLast.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const countThis = nonPlannedThis.length
    const countLast = nonPlannedLast.length
    const villagesThis = new Set(nonPlannedThis.map((s) => s.village_code_localite ?? s.village_name)).size
    const villagesLast = new Set(nonPlannedLast.map((s) => s.village_code_localite ?? s.village_name)).size

    const statuses = { delivered: 0, in_progress: 0, delayed: 0, planned: 0 }
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

  const globalImpact = useMemo(() => {
    const totalVolume = past.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const totalSupplies = past.length
    const villagesCovered = new Set(
      past.map((s) => s.village_code_localite ?? s.village_name),
    ).size
    return { totalVolume, totalSupplies, villagesCovered }
  }, [past])

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
    for (const s of past) {
      const d = new Date(s.supply_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const m = months.find((x) => x.key === key)
      if (m) m.value += Number(s.quantity_m3)
    }
    return months.map((m) => ({ label: m.label, value: m.value }))
  }, [past])

  const statusDistribution = useMemo(() => {
    const stat = { delivered: 0, planned: 0, in_progress: 0, delayed: 0 }
    for (const s of supplies) stat[s.status]++
    return stat
  }, [supplies])

  const topVillages = useMemo(() => {
    const byVillage = new Map<string, { name: string; value: number }>()
    for (const s of past) {
      const key = String(s.village_code_localite ?? s.village_name)
      const cur = byVillage.get(key)
      const add = Number(s.quantity_m3)
      if (cur) cur.value += add
      else byVillage.set(key, { name: s.village_name, value: add })
    }
    return Array.from(byVillage.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [past])

  const recentSupplies = past.slice(0, 5)
  const upcomingSupplies = upcoming.slice(0, 6)

  // ─── Routing internes des vues nav ───────────────────────────────
  if (nav === 'reports') {
    return (
      <div className="flex min-h-screen w-screen bg-[#f8fafc]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
        <DashboardSidebar active="reports" onNavigate={handleNav} globalImpact={globalImpact} />
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <ReportsPage />
        </div>
      </div>
    )
  }

  if (nav === 'supplies') {
    return (
      <div className="flex min-h-screen w-screen bg-[#f8fafc]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
        <DashboardSidebar active="supplies" onNavigate={handleNav} globalImpact={globalImpact} />
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <SuppliesPage user={user} villageEvals={villageEvals} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-screen bg-[#f8fafc] text-slate-900 flex"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}
    >
      <DashboardSidebar active={nav} onNavigate={handleNav} globalImpact={globalImpact} />

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
          {/* ── Header ── */}
          <header className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-slate-900 text-[26px] font-bold tracking-tight leading-none">Dashboard</h1>
              <p className="text-slate-500 text-[14px] mt-1.5">
                Bienvenue, {organization} <span className="inline-block ml-1">👋</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <span className="text-base leading-none">+</span>
                Nouveau ravitaillement
              </button>
              <button className="relative w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition flex items-center justify-center" title="Notifications">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
              </button>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2.5 pl-3 pr-1 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
                title="Cliquer pour se déconnecter"
              >
                <div className="text-right leading-tight">
                  <div className="text-slate-900 text-[13px] font-semibold">{organization}</div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider">{ORG_TYPE_LABEL[orgType]}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-[13px] font-bold">
                  {getInitials(organization)}
                </div>
              </button>
            </div>
          </header>

          {/* ── ⚠️ ALERTE OPÉRATIONNELLE (visible en priorité) ── */}
          <UpcomingAlert upcoming={upcoming} organization={organization} />

          {/* ── 4 Métriques ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Eau livrée" subLabel="(ce mois)" value={`${metrics.volumeThis.toLocaleString('fr-FR')} m³`} changePct={metrics.volumeChangePct}
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" /></svg>}
            />
            <MetricCard label="Ravitaillements" subLabel="(ce mois)" value={metrics.countThis.toString()} changePct={metrics.countChangePct}
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /></svg>}
            />
            <MetricCard label="Villages couverts" subLabel="(ce mois)" value={metrics.villagesThis.toString()} changePct={metrics.villagesChangePct}
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            />
            <StatusMetricCard statuses={metrics.statuses} />
          </section>

          {/* ── Prochains ravitaillements planifiés ── */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-slate-900 text-[15px] font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Prochains ravitaillements planifiés
                </h2>
                <p className="text-slate-500 text-[12px] mt-0.5">
                  Interventions à venir dans les 14 prochains jours · toutes organisations
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full">
                {upcomingSupplies.length} en attente
              </span>
            </div>

            {upcomingSupplies.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun ravitaillement planifié pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {upcomingSupplies.map((s) => (
                  <UpcomingSupplyCard
                    key={s.id}
                    supply={s}
                    distanceKm={distanceForVillage(s.village_code_localite)}
                    isMine={s.organization === organization}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Row : Ravitaillements récents + Carte ── */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h2 className="text-slate-900 text-[15px] font-semibold">Ravitaillements récents</h2>
                  <p className="text-slate-500 text-[12px] mt-0.5">Réalisés par les partenaires</p>
                </div>
                <button
                  onClick={() => setNav('supplies')}
                  className="text-sky-600 hover:text-sky-700 text-[12px] font-medium"
                >
                  Voir tout
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {loadingSupplies ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Chargement…</div>
                ) : recentSupplies.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Aucun ravitaillement.</div>
                ) : (
                  recentSupplies.map((s) => (
                    <RecentSupplyRow
                      key={s.id}
                      supply={s}
                      distanceKm={distanceForVillage(s.village_code_localite)}
                      isMine={s.organization === organization}
                    />
                  ))
                )}
              </div>
            </div>

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
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="mb-4">
                <h2 className="text-slate-900 text-[15px] font-semibold">Évolution des livraisons (m³)</h2>
                <p className="text-slate-500 text-[11px] mt-0.5">6 derniers mois · toutes organisations</p>
              </div>
              <LineChart points={timelinePoints} color="#0ea5e9" />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="mb-4">
                <h2 className="text-slate-900 text-[15px] font-semibold">Répartition par statut</h2>
                <p className="text-slate-500 text-[11px] mt-0.5">Tous ravitaillements confondus</p>
              </div>
              <div className="flex items-center gap-5">
                <DonutChart
                  segments={[
                    { label: 'Livrés',    value: statusDistribution.delivered,   color: STATUS_META.delivered.hex   },
                    { label: 'Planifiés', value: statusDistribution.planned,     color: STATUS_META.planned.hex     },
                    { label: 'En cours',  value: statusDistribution.in_progress, color: STATUS_META.in_progress.hex },
                    { label: 'Retardés',  value: statusDistribution.delayed,     color: STATUS_META.delayed.hex     },
                  ]}
                />
                <div className="flex-1 space-y-2">
                  <DonutLegend color={STATUS_META.delivered.hex}   label="Livrés"    count={statusDistribution.delivered}   total={supplies.length} />
                  <DonutLegend color={STATUS_META.planned.hex}     label="Planifiés" count={statusDistribution.planned}     total={supplies.length} />
                  <DonutLegend color={STATUS_META.in_progress.hex} label="En cours"  count={statusDistribution.in_progress} total={supplies.length} />
                  <DonutLegend color={STATUS_META.delayed.hex}     label="Retardés"  count={statusDistribution.delayed}     total={supplies.length} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-slate-900 text-[15px] font-semibold">Top villages</h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Quantité livrée cumulée</p>
                </div>
                <button
                  onClick={() => setNav('villages')}
                  className="text-sky-600 hover:text-sky-700 text-[12px] font-medium"
                >
                  Voir tout
                </button>
              </div>
              <TopVillagesList items={topVillages} />
            </div>
          </section>

          <p className="text-slate-400 text-[11px] text-center pt-4 pb-8">
            MINAI · Plateforme d'intelligence géospatiale · Données ANSADE RGPH-5 · UNICEF · Banque Mondiale
          </p>
        </div>
      </div>

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

function UpcomingAlert({ upcoming, organization }: { upcoming: Supply[]; organization: string }) {
  const mineCount = upcoming.filter((s) => s.organization === organization).length
  const othersCount = upcoming.length - mineCount
  if (upcoming.length === 0) return null

  const nextOne = upcoming[0]
  const daysUntil = Math.max(0, Math.ceil((new Date(nextOne.supply_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="bg-gradient-to-r from-sky-50 to-white border border-sky-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-sky-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-slate-900 font-semibold text-[14px] truncate">
            Prochain ravitaillement dans {daysUntil} jour{daysUntil > 1 ? 's' : ''} · {nextOne.village_name}
          </div>
          <div className="text-slate-600 text-[12px] mt-0.5">
            Prévu par {nextOne.organization}
            {othersCount > 0 && (
              <span className="text-slate-500"> · {upcoming.length} interventions planifiées ({mineCount} par {organization}, {othersCount} par d'autres partenaires)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, subLabel, value, changePct, icon }: {
  label: string; subLabel: string; value: string; changePct: number | null; icon: React.ReactElement
}) {
  const isUp = changePct !== null && changePct >= 0
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-600 text-[13px] font-medium">{label}</div>
          <div className="text-slate-400 text-[11px]">{subLabel}</div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">{icon}</div>
      </div>
      <div className="mt-4 text-slate-900 text-[28px] font-bold leading-none tracking-tight">{value}</div>
      {changePct !== null ? (
        <div className={`mt-2.5 text-[12px] flex items-center gap-1 ${isUp ? 'text-sky-600' : 'text-red-500'}`}>
          <span>{isUp ? '+' : ''}{changePct.toFixed(0)}% par rapport au mois dernier</span>
          <span>{isUp ? '↗' : '↘'}</span>
        </div>
      ) : (
        <div className="mt-2.5 text-[12px] text-slate-400">Pas de comparaison disponible</div>
      )}
    </div>
  )
}

function StatusMetricCard({ statuses }: { statuses: { delivered: number; in_progress: number; delayed: number; planned: number } }) {
  const total = statuses.delivered + statuses.in_progress + statuses.delayed + statuses.planned
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-600 text-[13px] font-medium">Statut des opérations</div>
          <div className="text-slate-400 text-[11px]">(ce mois)</div>
        </div>
        <DonutChart
          size={60}
          thickness={7}
          segments={[
            { label: 'l', value: statuses.delivered,   color: STATUS_META.delivered.hex   },
            { label: 'p', value: statuses.planned,     color: STATUS_META.planned.hex     },
            { label: 'e', value: statuses.in_progress, color: STATUS_META.in_progress.hex },
            { label: 'r', value: statuses.delayed,     color: STATUS_META.delayed.hex     },
          ]}
        />
      </div>
      <div className="mt-3 space-y-1.5">
        <StatusLine color={STATUS_META.delivered.hex}   label="Livrés"    count={statuses.delivered}   pct={pct(statuses.delivered)} />
        <StatusLine color={STATUS_META.planned.hex}     label="Planifiés" count={statuses.planned}     pct={pct(statuses.planned)} />
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
        <span className="text-slate-600">{label}</span>
      </div>
      <div className="text-slate-500 tabular-nums">{count} ({pct}%)</div>
    </div>
  )
}

function DonutLegend({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-slate-700">{label}</span>
      </div>
      <div className="text-slate-500 tabular-nums">
        {pct}% <span className="text-slate-400">({count})</span>
      </div>
    </div>
  )
}

function RecentSupplyRow({ supply, distanceKm, isMine }: { supply: Supply; distanceKm: number | null; isMine: boolean }) {
  const st = STATUS_META[supply.status]
  return (
    <div className="px-5 py-3 hover:bg-slate-50 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${st.dotBg} shrink-0`} />
            <span className="text-slate-900 font-semibold text-[13px] truncate">{supply.village_name}</span>
            {isMine && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                Vous
              </span>
            )}
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
            <span>{supply.village_wilaya}</span>
            {distanceKm !== null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
                  </svg>
                  {distanceKm.toFixed(1)} km
                </span>
              </>
            )}
          </div>
          <div className="text-slate-500 text-[11px] mt-1 truncate">
            <span className="font-medium text-slate-700">{supply.organization}</span> · {Number(supply.quantity_m3).toLocaleString('fr-FR')} m³
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${st.bgClass} ${st.textClass}`}>{st.label}</div>
          <div className="text-slate-400 text-[11px] mt-1">{formatShortDate(supply.supply_date)}</div>
        </div>
      </div>
    </div>
  )
}

function UpcomingSupplyCard({ supply, distanceKm, isMine }: { supply: Supply; distanceKm: number | null; isMine: boolean }) {
  const daysUntil = Math.max(0, Math.ceil((new Date(supply.supply_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const orgBg = ORG_TYPE_BG[supply.organization_type]
  return (
    <div className={`border rounded-xl p-4 transition ${isMine ? 'bg-sky-50/50 border-sky-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-slate-900 font-semibold text-[14px] truncate">{supply.village_name}</div>
          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{supply.village_wilaya}</span>
            {distanceKm !== null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  💧 {distanceKm.toFixed(1)} km
                </span>
              </>
            )}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded shrink-0">
          J-{daysUntil}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[12px]">
        <div>
          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${orgBg}`}>
            {supply.organization}
          </span>
          {isMine && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded ml-1">
              Vous
            </span>
          )}
        </div>
        <div className="text-slate-700 font-semibold tabular-nums">
          {Number(supply.quantity_m3).toLocaleString('fr-FR')} m³
        </div>
      </div>
      {supply.notes && (
        <div className="mt-2 text-[11px] text-slate-500 italic truncate">
          {supply.notes}
        </div>
      )}
    </div>
  )
}

// ─── Utils ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}
