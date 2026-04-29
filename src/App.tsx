import { useCallback, useMemo, useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import LandingPage from './components/LandingPage'
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

type View = 'landing' | 'map'

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

  if (view === 'landing') {
    return (
      <LandingPage
        onEnter={() => {
          setView('map')
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen">
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
        }}
        onClearConvoy={() => setConvoyTarget(null)}
        onSelectVillage={setSelectedVillage}
      />
      <main className="flex-1 relative">
        <button
          onClick={() => setView('landing')}
          className="absolute top-4 left-4 z-30 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full border border-white/15 hover:bg-slate-900 hover:border-white/30 transition shadow-lg"
          title="Retour à la page d'accueil"
        >
          ← MINAI
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
