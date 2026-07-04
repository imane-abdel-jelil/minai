/**
 * DashboardPage — tableau de bord Water4All (Amina Moktar).
 *
 * Design inspiré des interfaces Apple : beaucoup de whitespace, typo
 * système, cards subtiles avec bordures légères, hiérarchie visuelle
 * claire, actions primaires évidentes, données lisibles au premier
 * coup d'œil.
 *
 * Sections :
 *   1. Barre de nav épurée (logo + persona + logout)
 *   2. Hero de bienvenue avec grande typo
 *   3. Actions primaires (Ouvrir la carte + Nouveau ravitaillement)
 *   4. Vue d'ensemble : 4 tuiles métriques
 *   5. Activité inter-organisations : ravitaillements de toutes les
 *      ONG et institutions, avec filtre "Toutes" vs "Water4All"
 *   6. Villages en attente de ravitaillement (priorités ANSADE)
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Supply, type OrganizationType } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import { statusColor as villageStatusColor, statusLabel as villageStatusLabel } from '../lib/villages'
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import AddSupplyModal from './AddSupplyModal'
import SuppliesMapCard from './SuppliesMapCard'

interface Props {
  user: User
  villageEvals: VillageEval[]
  onOpenMap: () => void
  onSignOut: () => void
}

// ─── Labels & metadata ───────────────────────────────────────────────

const STATUS_META: Record<Supply['status'], { label: string; color: string; bg: string }> = {
  delivered:   { label: 'Livré',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
  in_progress: { label: 'En cours', color: 'text-amber-700',   bg: 'bg-amber-50' },
  delayed:     { label: 'Reporté',  color: 'text-red-700',     bg: 'bg-red-50' },
}

const ORG_TYPE_META: Record<OrganizationType, { label: string; color: string }> = {
  ngo:          { label: 'ONG',              color: 'text-slate-600' },
  un_agency:    { label: 'Agence ONU',       color: 'text-blue-700' },
  red_crescent: { label: 'Croissant-Rouge',  color: 'text-red-700' },
  institution:  { label: 'Institution',      color: 'text-slate-800' },
}

// ─── Composant principal ─────────────────────────────────────────────

type OrgFilter = 'all' | 'mine'

export default function DashboardPage({ user, villageEvals, onOpenMap, onSignOut }: Props) {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loadingSupplies, setLoadingSupplies] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('all')

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    'Partenaire'
  const firstName = displayName.split(' ')[0]
  const role = 'Coordinatrice logistique'
  const organization =
    (user.user_metadata?.organization as string | undefined) || 'Water4All'

  // ─── Chargement des ravitaillements Supabase ──────────────────────
  const fetchSupplies = async () => {
    if (!supabase) {
      setLoadingSupplies(false)
      return
    }
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('supply_date', { ascending: false })
      .limit(30)
    if (error) console.warn('Erreur chargement supplies :', error.message)
    setSupplies((data as Supply[]) || [])
    setLoadingSupplies(false)
  }

  useEffect(() => {
    fetchSupplies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Filtrage par organisation ────────────────────────────────────
  const filteredSupplies = useMemo(() => {
    if (orgFilter === 'mine') {
      return supplies.filter((s) => s.organization === organization)
    }
    return supplies
  }, [supplies, orgFilter, organization])

  // ─── Prochains villages en attente ────────────────────────────────
  const upcoming = useMemo(() => {
    return [...villageEvals]
      .filter((e) => e.status !== 'ok')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 6)
  }, [villageEvals])

  // ─── Métriques ────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const recent = supplies.filter((s) => new Date(s.supply_date) >= thirtyDaysAgo)
    const totalVolume = recent.reduce((sum, s) => sum + Number(s.quantity_m3), 0)
    const uniqueOrgs = new Set(supplies.map((s) => s.organization)).size

    const populationReached = recent.reduce((sum, s) => {
      const v = villageEvals.find(
        (ev) => ev.village.id === String(s.village_code_localite ?? ''),
      )
      return sum + (v?.village.population || 0)
    }, 0)

    return {
      recentCount: recent.length,
      totalVolume,
      populationReached,
      uniqueOrgs,
    }
  }, [supplies, villageEvals])

  const mineCount = useMemo(
    () => supplies.filter((s) => s.organization === organization).length,
    [supplies, organization],
  )

  return (
    <div className="min-h-screen w-screen bg-[#fbfbfd]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      {/* ═════════════ NAV BAR ═════════════ */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo Water4All */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#1d1d1f]">
              {organization}
            </span>
          </div>

          {/* Persona + logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <div className="text-[13px] font-medium text-[#1d1d1f]">{displayName}</div>
              <div className="text-[11px] text-[#6e6e73]">{role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-black/5 flex items-center justify-center text-slate-700 font-semibold text-xs">
              {getInitials(displayName)}
            </div>
            <button
              onClick={onSignOut}
              className="text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] font-medium transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════ CONTENU ═════════════ */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* ─── HERO WELCOME ─── */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="text-[13px] text-[#6e6e73] font-medium mb-2">
              {formatToday()}
            </div>
            <h1 className="text-[40px] sm:text-[44px] font-bold text-[#1d1d1f] tracking-tight leading-[1.05]">
              Bonjour, {firstName}.
            </h1>
            <p className="text-[17px] text-[#6e6e73] mt-2 max-w-lg">
              Voici l'activité de vos partenaires et les villages prioritaires
              en attente de ravitaillement.
            </p>
          </div>

          {/* Actions primaires */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white border border-black/10 hover:bg-black/[0.03] text-[#1d1d1f] font-medium text-[14px] px-4 py-2.5 rounded-full transition flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              Nouveau ravitaillement
            </button>
            <button
              onClick={onOpenMap}
              className="bg-[#1d1d1f] hover:bg-black text-white font-medium text-[14px] px-4 py-2.5 rounded-full transition flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8l7-3 6 3 7-3v13l-7 3-6-3-7 3V8z" />
                <path d="M9 5v15M15 8v15" />
              </svg>
              Ouvrir la cartographie
            </button>
          </div>
        </section>

        {/* ─── MÉTRIQUES ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Ravitaillements 30 j"
            value={metrics.recentCount.toString()}
            hint="opérations enregistrées"
          />
          <MetricCard
            label="Volume distribué"
            value={metrics.totalVolume.toLocaleString('fr-FR')}
            hint="m³ d'eau · 30 derniers jours"
          />
          <MetricCard
            label="Population desservie"
            value={metrics.populationReached.toLocaleString('fr-FR')}
            hint="habitants · 30 derniers jours"
          />
          <MetricCard
            label="Partenaires actifs"
            value={metrics.uniqueOrgs.toString()}
            hint="ONG & institutions"
          />
        </section>

        {/* ─── CARTE INTERACTIVE DES RAVITAILLEMENTS ─── */}
        <SuppliesMapCard
          supplies={supplies}
          villageEvals={villageEvals}
          organization={organization}
        />

        {/* ─── ACTIVITÉ RÉCENTE ─── */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight">
                Activité récente
              </h2>
              <p className="text-[13px] text-[#6e6e73] mt-0.5">
                Ravitaillements enregistrés par les organisations partenaires
              </p>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-full">
              <FilterTab
                active={orgFilter === 'all'}
                onClick={() => setOrgFilter('all')}
                label="Toutes"
                count={supplies.length}
              />
              <FilterTab
                active={orgFilter === 'mine'}
                onClick={() => setOrgFilter('mine')}
                label={organization}
                count={mineCount}
              />
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl overflow-hidden divide-y divide-black/[0.06]">
            {loadingSupplies ? (
              <EmptyRow>Chargement de l'activité…</EmptyRow>
            ) : filteredSupplies.length === 0 ? (
              <EmptyRow>
                {orgFilter === 'mine'
                  ? `Aucun ravitaillement enregistré par ${organization}. Ajoutez-en un avec le bouton en haut à droite.`
                  : 'Aucune activité récente.'}
              </EmptyRow>
            ) : (
              filteredSupplies.slice(0, 10).map((s) => <SupplyRow key={s.id} supply={s} isMine={s.organization === organization} />)
            )}
          </div>
        </section>

        {/* ─── VILLAGES EN ATTENTE ─── */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight">
                Villages en attente
              </h2>
              <p className="text-[13px] text-[#6e6e73] mt-0.5">
                Priorités absolues à ravitailler · triées par urgence
              </p>
            </div>
            <button
              onClick={onOpenMap}
              className="text-[13px] text-[#0071e3] hover:text-[#0077ed] font-medium flex items-center gap-1"
            >
              Voir sur la carte
              <span aria-hidden>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((v) => (
              <UpcomingCard key={v.village.id} ev={v} onView={onOpenMap} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <p className="text-[12px] text-[#86868b] text-center pt-8 pb-4">
          MINAI · Plateforme d'intelligence géospatiale
          <br />
          Données ANSADE RGPH-5 · UNICEF · Banque Mondiale
        </p>
      </main>

      {/* ═════════════ MODAL AJOUT ═════════════ */}
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

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 hover:shadow-md hover:shadow-black/[0.03] transition">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[#6e6e73]">
        {label}
      </div>
      <div className="text-[32px] font-bold text-[#1d1d1f] tracking-tight mt-1.5 leading-none">
        {value}
      </div>
      <div className="text-[12px] text-[#86868b] mt-2">{hint}</div>
    </div>
  )
}

function FilterTab({
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
      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition flex items-center gap-1.5 ${
        active
          ? 'bg-white text-[#1d1d1f] shadow-sm'
          : 'text-[#6e6e73] hover:text-[#1d1d1f]'
      }`}
    >
      {label}
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
          active ? 'bg-black/[0.06] text-[#1d1d1f]' : 'text-[#86868b]'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function SupplyRow({ supply, isMine }: { supply: Supply; isMine: boolean }) {
  const status = STATUS_META[supply.status]
  const orgMeta = ORG_TYPE_META[supply.organization_type]

  return (
    <div className="px-5 py-4 hover:bg-black/[0.02] transition flex items-center gap-4">
      {/* Statut dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        supply.status === 'delivered' ? 'bg-emerald-500' :
        supply.status === 'in_progress' ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      {/* Village + wilaya */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[15px] text-[#1d1d1f]">
            {supply.village_name}
          </span>
          <span className="text-[13px] text-[#6e6e73]">·</span>
          <span className="text-[13px] text-[#6e6e73]">{supply.village_wilaya}</span>
          {isMine && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
              Vous
            </span>
          )}
        </div>
        {supply.notes && (
          <div className="text-[12px] text-[#86868b] mt-0.5 truncate">
            {supply.notes}
          </div>
        )}
      </div>

      {/* Organisation */}
      <div className="hidden md:block text-right shrink-0 min-w-[160px]">
        <div className={`text-[13px] font-medium ${orgMeta.color}`}>
          {supply.organization}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#86868b] mt-0.5">
          {orgMeta.label}
        </div>
      </div>

      {/* Quantité */}
      <div className="hidden sm:block text-right shrink-0 min-w-[70px]">
        <div className="text-[14px] font-semibold text-[#1d1d1f] tabular-nums">
          {Number(supply.quantity_m3).toLocaleString('fr-FR')} m³
        </div>
      </div>

      {/* Date */}
      <div className="text-right shrink-0 min-w-[80px]">
        <div className="text-[12px] text-[#6e6e73]">
          {formatRelativeDate(supply.supply_date)}
        </div>
      </div>

      {/* Statut badge (mobile fallback) */}
      <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shrink-0 ${status.bg} ${status.color} sm:hidden`}>
        {status.label}
      </div>
    </div>
  )
}

function UpcomingCard({ ev, onView }: { ev: VillageEval; onView: () => void }) {
  const statusColor = villageStatusColor(ev.status)
  const wilayaName =
    MAURITANIA_REGIONS.find((r) => r.id === ev.village.wilayaId)?.name ??
    ev.village.wilayaId

  return (
    <button
      onClick={onView}
      className="text-left bg-white border border-black/5 rounded-2xl p-4 hover:shadow-md hover:shadow-black/[0.03] hover:border-black/10 transition group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[15px] text-[#1d1d1f] truncate">
            {ev.village.name}
          </div>
          <div className="text-[12px] text-[#6e6e73] mt-0.5">{wilayaName}</div>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shrink-0"
          style={{
            background: `${statusColor}22`,
            color: statusColor,
          }}
        >
          {villageStatusLabel(ev.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/5">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#86868b]">
            Population
          </div>
          <div className="text-[14px] font-semibold text-[#1d1d1f] tabular-nums mt-0.5">
            {ev.village.population.toLocaleString('fr-FR')}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#86868b]">
            Point d'eau
          </div>
          <div className="text-[14px] font-semibold text-[#1d1d1f] tabular-nums mt-0.5">
            {ev.distanceToWaterKm.toFixed(1)} km
          </div>
        </div>
      </div>

      <div className="text-[12px] text-[#0071e3] font-medium mt-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
        Planifier un ravitaillement
        <span aria-hidden>→</span>
      </div>
    </button>
  )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-10 text-[13px] text-[#86868b] text-center">
      {children}
    </div>
  )
}

// ─── Utils ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatToday(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7) return `Il y a ${diff} j`
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
