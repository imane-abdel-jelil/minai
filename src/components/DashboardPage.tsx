/**
 * DashboardPage — tableau de bord post-login pour partenaires MINAI.
 *
 * Marque : Water4All (ONG humanitaire fictive, spécialisée eau au Sahel).
 * Persona : Amina Moktar, Coordinatrice logistique.
 *
 * Trois zones :
 *   1. Header (identité + rôle + logout)
 *   2. Métriques clés (3 tuiles)
 *   3. Deux colonnes : Derniers ravitaillements | Prochains villages en alerte
 *   4. CTA global : Ouvrir la carte MINAI
 *   5. Bouton flottant : Ajouter un ravitaillement (ouvre un modal)
 */
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Supply } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import { statusColor as villageStatusColor, statusLabel as villageStatusLabel } from '../lib/villages'
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'
import AddSupplyModal from './AddSupplyModal'

interface Props {
  user: User
  villageEvals: VillageEval[]
  onOpenMap: () => void
  onSignOut: () => void
}

// ─── Constantes visuelles ────────────────────────────────────────────

const SUPPLY_STATUS_LABELS: Record<Supply['status'], string> = {
  delivered: 'Livré',
  in_progress: 'En cours',
  delayed: 'Reporté',
}

const SUPPLY_STATUS_COLORS: Record<Supply['status'], { bg: string; text: string; dot: string }> = {
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  delayed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

// ─── Composant principal ─────────────────────────────────────────────

export default function DashboardPage({ user, villageEvals, onOpenMap, onSignOut }: Props) {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loadingSupplies, setLoadingSupplies] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    'Partenaire'
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
      .limit(5)
    if (error) {
      console.warn('Erreur chargement supplies :', error.message)
    }
    setSupplies((data as Supply[]) || [])
    setLoadingSupplies(false)
  }

  useEffect(() => {
    fetchSupplies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Prochains villages en alerte (top 5 par priority_score) ──────
  const upcoming = useMemo(() => {
    return [...villageEvals]
      .filter((e) => e.status !== 'ok')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
  }, [villageEvals])

  // ─── Métriques agrégées ────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalVillages = villageEvals.length
    const suppliesThisMonth = supplies.filter((s) => {
      const d = new Date(s.supply_date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const populationCovered = supplies.reduce((sum, s) => {
      // Trouve le village dans villageEvals pour récupérer la population
      const v = villageEvals.find(
        (ev) => ev.village.id === String(s.village_code_localite ?? ''),
      )
      return sum + (v?.village.population || 0)
    }, 0)
    return { totalVillages, suppliesThisMonth, populationCovered }
  }, [villageEvals, supplies])

  return (
    <div className="min-h-screen w-screen bg-slate-50">
      {/* ═════════════ HEADER ═════════════ */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Logo Water4All */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
              </svg>
            </div>
            <div>
              <div className="text-slate-900 font-bold text-lg leading-none">{organization}</div>
              <div className="text-slate-500 text-[11px] uppercase tracking-wider mt-0.5">
                Portail partenaire MINAI
              </div>
            </div>
          </div>

          {/* Persona + logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-slate-900 font-semibold text-sm leading-none">
                {displayName}
              </div>
              <div className="text-slate-500 text-xs mt-1">{role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
              {getInitials(displayName)}
            </div>
            <button
              onClick={onSignOut}
              className="text-slate-500 hover:text-slate-900 text-sm font-medium transition"
              title="Se déconnecter"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════ CONTENU ═════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Bienvenue + CTA carte */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour {displayName.split(' ')[0]}.
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Vue d'ensemble de vos opérations de ravitaillement en cours.
            </p>
          </div>
          <button
            onClick={onOpenMap}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-slate-900/10 transition flex items-center gap-2 self-start md:self-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 8l7-3 6 3 7-3v13l-7 3-6-3-7 3V8z" />
              <path d="M9 5v15M15 8v15" />
            </svg>
            Ouvrir la carte MINAI
          </button>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Metric
            label="Villages sous suivi"
            value={metrics.totalVillages.toLocaleString('fr-FR')}
            hint="dans la base ANSADE"
            color="cyan"
          />
          <Metric
            label="Ravitaillements ce mois"
            value={metrics.suppliesThisMonth.toString()}
            hint="opérations enregistrées"
            color="emerald"
          />
          <Metric
            label="Population couverte"
            value={metrics.populationCovered.toLocaleString('fr-FR')}
            hint="habitants desservis"
            color="amber"
          />
        </div>

        {/* Deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Derniers ravitaillements ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Derniers ravitaillements</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  5 opérations les plus récentes
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <span className="text-base leading-none">+</span> Ajouter un ravitaillement
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingSupplies ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  Chargement…
                </div>
              ) : supplies.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  Aucun ravitaillement enregistré.
                  <br />
                  Utilise le bouton ci-dessus pour en créer un.
                </div>
              ) : (
                supplies.map((s) => <SupplyRow key={s.id} supply={s} />)
              )}
            </div>
          </section>

          {/* ─── Prochains villages en alerte ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Prochains villages en alerte</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Priorités absolues à ravitailler — trié par urgence
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {upcoming.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  Chargement des priorités ANSADE…
                </div>
              ) : (
                upcoming.map((v) => (
                  <UpcomingRow key={v.village.id} ev={v} onView={onOpenMap} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <p className="text-slate-400 text-xs text-center pt-4">
          MINAI · Plateforme d'intelligence géospatiale · Données ANSADE RGPH-5 ·
          UNICEF · Banque Mondiale
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

// ─── Sous-composants ──────────────────────────────────────────────────

function Metric({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: string
  hint: string
  color: 'cyan' | 'emerald' | 'amber'
}) {
  const bg = {
    cyan: 'from-cyan-500/10 to-cyan-500/0',
    emerald: 'from-emerald-500/10 to-emerald-500/0',
    amber: 'from-amber-500/10 to-amber-500/0',
  }[color]
  const accent = {
    cyan: 'text-cyan-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }[color]
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} pointer-events-none`} />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          {label}
        </div>
        <div className={`text-3xl font-bold ${accent} mt-1.5`}>{value}</div>
        <div className="text-xs text-slate-500 mt-1">{hint}</div>
      </div>
    </div>
  )
}

function SupplyRow({ supply }: { supply: Supply }) {
  const colors = SUPPLY_STATUS_COLORS[supply.status]
  return (
    <div className="px-5 py-3 hover:bg-slate-50 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">
            {supply.village_name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {supply.village_wilaya} · {formatDate(supply.supply_date)} ·{' '}
            {supply.quantity_m3.toLocaleString('fr-FR')} m³
          </div>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shrink-0 ${colors.bg} ${colors.text} inline-flex items-center gap-1.5`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {SUPPLY_STATUS_LABELS[supply.status]}
        </span>
      </div>
      {supply.notes && (
        <div className="text-xs text-slate-500 mt-1.5 italic truncate">
          {supply.notes}
        </div>
      )}
    </div>
  )
}

function UpcomingRow({ ev, onView }: { ev: VillageEval; onView: () => void }) {
  const statusColor = villageStatusColor(ev.status)
  const wilayaName =
    MAURITANIA_REGIONS.find((r) => r.id === ev.village.wilayaId)?.name ??
    ev.village.wilayaId
  return (
    <div className="px-5 py-3 hover:bg-slate-50 transition group">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">
            {ev.village.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {wilayaName} · {ev.village.population.toLocaleString('fr-FR')} hab. ·{' '}
            {ev.distanceToWaterKm.toFixed(1)} km du point d'eau
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
            style={{
              background: `${statusColor}22`,
              color: statusColor,
            }}
          >
            {villageStatusLabel(ev.status)}
          </span>
          <button
            onClick={onView}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition"
          >
            Planifier convoi →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Utils ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
