/**
 * DashboardSidebar — barre latérale de navigation du dashboard MINAI.
 *
 * Palette blanc + bleu ciel (sky-500). Design institutionnel épuré.
 */

export type NavKey =
  | 'dashboard'
  | 'supplies'
  | 'map'
  | 'villages'
  | 'reports'
  | 'organizations'
  | 'profile'
  | 'settings'

interface Props {
  active: NavKey
  onNavigate: (k: NavKey) => void
  globalImpact: {
    totalVolume: number
    totalSupplies: number
    villagesCovered: number
  }
}

const Icons: Record<NavKey, React.ReactElement> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  ),
  supplies: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6M15 5l-3 3-3-3M4 22h16M6 18h12l-2-8H8l-2 8z" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l7-3 6 3 7-3v13l-7 3-6-3-7 3V8zM9 5v15M15 8v15" />
    </svg>
  ),
  villages: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V11l7-6 7 6v10M9 21v-5h6v5" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zM14 3v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  organizations: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'dashboard',     label: 'Dashboard' },
  { key: 'supplies',      label: 'Ravitaillements' },
  { key: 'map',           label: 'Carte interactive' },
  { key: 'villages',      label: 'Villages' },
  { key: 'reports',       label: 'Rapports & export' },
  { key: 'organizations', label: 'Organisations' },
  { key: 'profile',       label: 'Profil' },
  { key: 'settings',      label: 'Paramètres' },
]

export default function DashboardSidebar({ active, onNavigate, globalImpact }: Props) {
  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* ── Logo ── */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
          </svg>
        </div>
        <div>
          <div className="text-slate-900 font-bold text-[18px] leading-none tracking-tight">MINAI</div>
          <div className="text-slate-400 text-[10px] mt-1 tracking-wide">AI for Water Access</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            active={item.key === active}
            onClick={() => onNavigate(item.key)}
            icon={Icons[item.key]}
            label={item.label}
          />
        ))}
      </nav>

      {/* ── Impact global ── */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-200 rounded-xl p-4">
          <div className="text-slate-900 text-[13px] font-semibold">Impact global</div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-3">
            toutes organisations
          </div>
          <div className="space-y-2.5">
            <ImpactRow value={`${globalImpact.totalVolume.toLocaleString('fr-FR')} m³`} label="Total d'eau livrée" />
            <ImpactRow value={globalImpact.totalSupplies.toString()} label="Ravitaillements" />
            <ImpactRow value={globalImpact.villagesCovered.toString()} label="Villages couverts" />
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="mt-4 w-full bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-medium py-2 rounded-lg transition flex items-center justify-center gap-1"
          >
            Voir le rapport complet
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactElement
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition ${
        active
          ? 'bg-sky-50 text-sky-700 border border-sky-200'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
      }`}
    >
      <span className={`w-4 h-4 shrink-0 ${active ? 'text-sky-600' : ''}`}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function ImpactRow({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-sky-700 text-[18px] font-bold leading-none tabular-nums">{value}</div>
      <div className="text-slate-500 text-[10px] mt-1">{label}</div>
    </div>
  )
}
