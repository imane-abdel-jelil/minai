import { useCallback, useMemo, useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import type { Region } from './data/mauritania-regions'
import type { WilayaStats } from './lib/geo'

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

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [showWaterPoints, setShowWaterPoints] = useState(true)
  const [showWilayas, setShowWilayas] = useState(true)
  const [wilayaStats, setWilayaStats] = useState<Record<string, WilayaStats>>({})
  const [kindFilters, setKindFilters] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_KINDS.map((k) => [k, true]))
  )

  const handleStatsReady = useCallback(
    (stats: Record<string, WilayaStats>) => setWilayaStats(stats),
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

  return (
    <div className="flex h-screen w-screen">
      <Sidebar
        selectedRegion={selectedRegion}
        showWaterPoints={showWaterPoints}
        onToggleWaterPoints={setShowWaterPoints}
        showWilayas={showWilayas}
        onToggleWilayas={setShowWilayas}
        wilayaStats={wilayaStats}
        kindFilters={kindFilters}
        onToggleKind={toggleKind}
        onSetAllKinds={setAllKinds}
        kindCounts={kindCounts}
      />
      <main className="flex-1 relative">
        <MapView
          onRegionClick={setSelectedRegion}
          showWaterPoints={showWaterPoints}
          showWilayas={showWilayas}
          onStatsReady={handleStatsReady}
          kindFilters={kindFilters}
        />
      </main>
    </div>
  )
}
