import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import LandingPage from './components/LandingPage'
import UnderstandingPage from './components/UnderstandingPage'
import VillageInfoOverlay from './components/VillageInfoOverlay'
import AuthPage from './components/AuthPage'
import DashboardPage from './components/DashboardPage'
import type { Region } from './data/mauritania-regions'
import type { Village } from './data/mauritania-villages'
import { loadAnsadeVillages, topPrioritiesAnsade } from './lib/ansade-villages'
import type { WilayaStats } from './lib/geo'
import { useI18n } from './lib/i18n'
import { computeAllScores } from './lib/score'
import type { VillageEval } from './lib/villages'
import { useAuth } from './hooks/useAuth'

const ALL_KINDS = [
  'drinking_water',
  'water_point',
  'well',
  'borehole',
  'spring',
  'tap',
  'water_works',
  'other',
] as const

type View = 'landing' | 'understanding' | 'auth' | 'dashboard' | 'map'

// Lit le paramètre ?view= depuis l'URL pour que les liens ouverts
// dans un nouvel onglet démarrent directement sur la bonne vue.
function getInitialView(): View {
  if (typeof window === 'undefined') return 'landing'
  const params = new URLSearchParams(window.location.search)
  const v = params.get('view')
  if (v === 'map' || v === 'understanding' || v === 'dashboard' || v === 'auth') return v
  return 'landing'
}

export default function App() {
  const { t } = useI18n()
  const { user, loading: authLoading, signOut } = useAuth()
  // Vue par défaut = landing page. Si l'URL contient ?view=map (lien
  // ouvert dans un nouvel onglet), on démarre directement sur la carte.
  const [view, setView] = useState<View>(getInitialView)

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null)
  // Wilaya cliquée → drill-down : on affiche tous les villages de cette wilaya
  // Si null, on affiche uniquement les villages prioritaires (status critical/risk).
  const [selectedWilaya, setSelectedWilaya] = useState<Region | null>(null)
  const [showWaterPoints, setShowWaterPoints] = useState(true)
  const [showWilayas, setShowWilayas] = useState(true)
  const [showVillages, setShowVillages] = useState(true)
  const [wilayaStats, setWilayaStats] = useState<Record<string, WilayaStats>>({})
  const [waterPoints, setWaterPoints] = useState<GeoJSON.FeatureCollection | null>(null)
  const [kindFilters, setKindFilters] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_KINDS.map((k) => [k, true]))
  )
  // Villages ANSADE chargés en async — 8447 villages avec status pré-calculé
  const [villageEvals, setVillageEvals] = useState<VillageEval[]>([])
  const [villagesGeojson, setVillagesGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  // Convoi simulé : cible = un village (depuis Nouakchott)
  const [convoyTarget, setConvoyTarget] = useState<Village | null>(null)
  // Sidebar visible ? Sur mobile elle est masquée par défaut, sur desktop visible.
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Chargement des 8447 villages ANSADE (RGPH-5) au démarrage
  useEffect(() => {
    loadAnsadeVillages()
      .then(({ villages, geojson }) => {
        setVillageEvals(villages)
        setVillagesGeojson(geojson)
      })
      .catch((e) => {
        console.warn(
          'ANSADE villages-scored.geojson introuvable. ' +
            'Lance npm run fetch:ansade puis npm run compute:scores pour le générer.',
          e,
        )
      })
  }, [])

  const handleStatsReady = useCallback(
    (stats: Record<string, WilayaStats>) => setWilayaStats(stats),
    []
  )

  const handleWaterPointsReady = useCallback(
    (data: GeoJSON.FeatureCollection | null) => setWaterPoints(data),
    []
  )

  const toggleKind = useCallback((kind: string) => {
    setKindFilters((prev) => ({ ...prev, [kind]: !(prev[kind] ?? true) }))
  }, [])

  const setAllKinds = useCallback((value: boolean) => {
    setKindFilters(Object.fromEntries(ALL_KINDS.map((k) => [k, value])))
  }, [])

  // Compteurs globaux par type, dérivés des stats par wilaya
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of Object.values(wilayaStats)) {
      for (const [k, n] of Object.entries(s.byKind)) {
        counts[k] = (counts[k] || 0) + n
      }
    }
    return counts
  }, [wilayaStats])

  const computedScores = useMemo(() => computeAllScores(wilayaStats), [wilayaStats])

  // Top 3 villages les plus urgents — basé sur priority_score ANSADE pré-calculé
  const priorities = useMemo(() => topPrioritiesAnsade(villageEvals, 3), [villageEvals])

  // Eval directement extraite des feature properties au clic (instant —
  // pas besoin d'attendre que les 8447 villages du gros fichier soient
  // chargés). Le lookup dans villageEvals reste en fallback pour le
  // cas où l'utilisateur sélectionne un village sans passer par le clic
  // map (ex: liste priorités sidebar).
  const [selectedEvalDirect, setSelectedEvalDirect] = useState<VillageEval | null>(null)

  const selectedVillageEval = useMemo(() => {
    if (!selectedVillage) return null
    // 1) Si le clic vient de fournir un eval qui correspond → on l'utilise
    if (selectedEvalDirect && selectedEvalDirect.village.id === selectedVillage.id) {
      return selectedEvalDirect
    }
    // 2) Sinon fallback : lookup dans la liste complète (8447 villages)
    return villageEvals.find((e) => e.village.id === selectedVillage.id) ?? null
  }, [selectedVillage, selectedEvalDirect, villageEvals])

  // Handler unique : met à jour à la fois le village ET l'eval directe.
  // Appelé depuis MapView (clic pin) et depuis Sidebar (liste priorités).
  // L'overlay flottant <VillageInfoOverlay> s'affiche directement au
  // clic — pas besoin d'ouvrir la sidebar.
  const handleVillageSelect = useCallback(
    (v: Village | null, ev: VillageEval | null = null) => {
      setSelectedVillage(v)
      setSelectedEvalDirect(ev)
    },
    []
  )

  // Memoize tous les callbacks inline pour MapView. Si on les laisse
  // inline, ils sont recréés à chaque render et React.memo sur MapView
  // ne sert à rien → MapView re-render à chaque clic → re-render des
  // 8447 features Mapbox → canvas vide → écran 'noir'.
  const handleRegionClick = useCallback((r: Region | null) => {
    setSelectedRegion(r)
    setSelectedWilaya(r)
  }, [])
  const handleCloseOverlay = useCallback(
    () => handleVillageSelect(null),
    [handleVillageSelect],
  )

  // "Voir la carte" depuis la landing : ouvre l'écran de connexion
  // dans un nouvel onglet. Après login → dashboard → puis carte.
  // Comme ça la landing reste accessible dans l'onglet d'origine.
  const enterMap = () => {
    if (typeof window !== 'undefined') {
      // Si déjà connecté, on saute directement au dashboard.
      const target = user ? 'dashboard' : 'auth'
      const url = `${window.location.pathname}?view=${target}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
  // Ouverture directe de la carte depuis le dashboard (même onglet).
  const openMapFromDashboard = useCallback(() => {
    setView('map')
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])
  const handleSignOut = useCallback(async () => {
    await signOut()
    setView('auth')
  }, [signOut])
  const goToUnderstanding = () => {
    setView('understanding')
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
  const goToLanding = () => {
    setView('landing')
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
  // Bascule sur la landing puis scrolle vers l'ancre demandée (utilisé par
  // les liens 'Problème', 'Solution', etc. dans le header de la page Accès
  // à l'eau, qui pointent vers des sections de la landing).
  const goToLandingSection = (sectionId: string) => {
    setView('landing')
    // Réessaie pendant 1 seconde max — la landing peut prendre du temps à
    // monter (Reveal animations, photos, etc.). On tente toutes les 50ms
    // jusqu'à trouver l'élément.
    let attempts = 0
    const tryScroll = () => {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      if (attempts++ < 20) {
        setTimeout(tryScroll, 50)
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      }
    }
    setTimeout(tryScroll, 50)
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnter={enterMap}
        onUnderstand={goToUnderstanding}
      />
    )
  }

  if (view === 'understanding') {
    return (
      <UnderstandingPage
        onBack={goToLanding}
        onEnterMap={enterMap}
        onJumpToSection={goToLandingSection}
      />
    )
  }

  // ─── Auth wall ─────────────────────────────────────────────────
  // Les vues 'auth', 'dashboard' et 'map' nécessitent d'être connecté.
  // Tant que le check session est en cours on montre un spinner rapide.
  if (authLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-sm opacity-60">Chargement…</div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage onBackToLanding={goToLanding} />
  }

  if (view === 'auth' || view === 'dashboard') {
    return (
      <DashboardPage
        user={user}
        villageEvals={villageEvals}
        onOpenMap={openMapFromDashboard}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar : drawer slide-in sur mobile, fixe sur desktop */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-full sm:w-96 md:w-96 max-w-[100vw]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar
          selectedRegion={selectedRegion}
          selectedWilaya={selectedWilaya}
          onClearWilaya={() => {
            setSelectedWilaya(null)
            setSelectedRegion(null)
          }}
          selectedVillage={selectedVillage}
          selectedVillageEval={selectedVillageEval}
          showWaterPoints={showWaterPoints}
          onToggleWaterPoints={setShowWaterPoints}
          showWilayas={showWilayas}
          onToggleWilayas={setShowWilayas}
          showVillages={showVillages}
          onToggleVillages={setShowVillages}
          wilayaStats={wilayaStats}
          kindFilters={kindFilters}
          onToggleKind={toggleKind}
          onSetAllKinds={setAllKinds}
          kindCounts={kindCounts}
          computedScores={computedScores}
          priorities={priorities}
          villageEvals={villageEvals}
          convoyTarget={convoyTarget}
          onTargetConvoy={(v) => {
            setConvoyTarget(v)
            setSelectedVillage(v)
            // sur mobile, on referme le panneau pour voir le convoi sur la carte
            if (window.innerWidth < 768) setSidebarOpen(false)
          }}
          onClearConvoy={() => setConvoyTarget(null)}
          onSelectVillage={handleVillageSelect}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Backdrop quand sidebar ouverte sur mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 relative bg-amber-900">
        {/* Bouton retour dashboard — coin haut-gauche */}
        <button
          onClick={() => setView('dashboard')}
          className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full border border-white/15 hover:bg-slate-900 hover:border-white/30 transition shadow-lg"
          title="Retour au tableau de bord"
        >
          ← Tableau de bord
        </button>

        {/* Bouton hamburger mobile pour ouvrir la sidebar — coin haut-droit */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full border border-white/15 hover:bg-slate-900 transition shadow-lg flex items-center gap-2"
          title={t('Ouvrir le panneau')}
        >
          <span className="relative block w-4 h-3">
            <span className="absolute left-0 top-0 h-0.5 w-4 bg-white rounded-full" />
            <span className="absolute left-0 top-1.5 h-0.5 w-4 bg-white rounded-full" />
            <span className="absolute left-0 top-3 h-0.5 w-4 bg-white rounded-full" />
          </span>
          {t('Panneau')}
        </button>

        <MapView
          onRegionClick={handleRegionClick}
          onVillageClick={handleVillageSelect}
          selectedWilaya={selectedWilaya}
          showWaterPoints={showWaterPoints}
          showWilayas={showWilayas}
          showVillages={showVillages}
          onStatsReady={handleStatsReady}
          onWaterPointsReady={handleWaterPointsReady}
          kindFilters={kindFilters}
          computedScores={computedScores}
          villageEvals={villageEvals}
          villagesGeojson={villagesGeojson}
          convoyTarget={convoyTarget}
        />

        {/* Overlay village flottant — affiche les infos directement
            au-dessus de la carte (indépendant de Mapbox et de la sidebar).
            Stable, pas de re-render de la carte au mount/unmount. */}
        <VillageInfoOverlay
          village={selectedVillage}
          ev={selectedVillageEval}
          onClose={handleCloseOverlay}
        />
      </main>
    </div>
  )
}
