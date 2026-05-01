import { useCallback, useMemo, useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import LandingPage from './components/LandingPage'
import UnderstandingPage from './components/UnderstandingPage'
import type { Region } from './data/mauritania-regions'
import { MAURITANIA_VILLAGES, type Village } from './data/mauritania-villages'
import type { WilayaStats } from './lib/geo'
import { computeAllScores } from './lib/score'
import { evaluateAllVillages, topPriorities } from './lib/villages'

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

type View = 'landing' | 'understanding' | 'map'

export default function App() {
  // Vue par défaut = landing page. L'utilisateur entre dans la carte via un CTA.
  const [view, setView] = useState<View>('landing')

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null)
  const [showWaterPoints, setShowWaterPoints] = useState(true)
  const [showWilayas, setShowWilayas] = useState(true)
  const [showVillages, setShowVillages] = useState(true)
  const [wilayaStats, setWilayaStats] = useState<Record<string, WilayaStats>>({})
  const [waterPoints, setWaterPoints] = useState<GeoJSON.FeatureCollection | null>(null)
  const [kindFilters, setKindFilters] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_KINDS.map((k) => [k, true]))
  )
  // Convoi simulé : cible = un village (depuis Nouakchott)
  const [convoyTarget, setConvoyTarget] = useState<Village | null>(null)
  // Sidebar visible ? Sur mobile elle est masquée par défaut, sur desktop visible.
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Évaluation village par village (statut + distance + priorité)
  const villageEvals = useMemo(
    () => evaluateAllVillages(MAURITANIA_VILLAGES, waterPoints),
    [waterPoints]
  )

  // Top 3 villages les plus urgents (critical/risk seulement)
  const priorities = useMemo(() => topPriorities(villageEvals, 3), [villageEvals])

  // Évaluation du village sélectionné (lookup dans la liste)
  const selectedVillageEval = useMemo(() => {
    if (!selectedVillage) return null
    return villageEvals.find((e) => e.village.id === selectedVillage.id) ?? null
  }, [selectedVillage, villageEvals])

  const enterMap = () => {
    setView('map')
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
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
    // attendre que la landing soit montée avant de scroller
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      })
    })
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
          convoyTarget={convoyTarget}
          onTargetConvoy={(v) => {
            setConvoyTarget(v)
            setSelectedVillage(v)
            // sur mobile, on referme le panneau pour voir le convoi sur la carte
            if (window.innerWidth < 768) setSidebarOpen(false)
          }}
          onClearConvoy={() => setConvoyTarget(null)}
          onSelectVillage={(v) => {
            setSelectedVillage(v)
          }}
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

      <main className="flex-1 relative">
        {/* Bouton retour landing — coin haut-gauche */}
        <button
          onClick={() => setView('landing')}
          className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full border border-white/15 hover:bg-slate-900 hover:border-white/30 transition shadow-lg"
          title="Retour à la page d'accueil"
        >
          ← MINAI
        </button>

        {/* Bouton hamburger mobile pour ouvrir la sidebar — coin haut-droit */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full border border-white/15 hover:bg-slate-900 transition shadow-lg flex items-center gap-2"
          title="Ouvrir le panneau"
        >
          <span className="relative block w-4 h-3">
            <span className="absolute left-0 top-0 h-0.5 w-4 bg-white rounded-full" />
            <span className="absolute left-0 top-1.5 h-0.5 w-4 bg-white rounded-full" />
            <span className="absolute left-0 top-3 h-0.5 w-4 bg-white rounded-full" />
          </span>
          Panneau
        </button>

        <MapView
          onRegionClick={setSelectedRegion}
          onVillageClick={setSelectedVillage}
          selectedVillage={selectedVillage}
          showWaterPoints={showWaterPoints}
          showWilayas={showWilayas}
          showVillages={showVillages}
          onStatsReady={handleStatsReady}
          onWaterPointsReady={handleWaterPointsReady}
          kindFilters={kindFilters}
          computedScores={computedScores}
          villageEvals={villageEvals}
          convoyTarget={convoyTarget}
        />
      </main>
    </div>
  )
}
