import { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import type { Region } from './data/mauritania-regions'

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [showWaterPoints, setShowWaterPoints] = useState(true)
  const [showWilayas, setShowWilayas] = useState(true)

  return (
    <div className="flex h-screen w-screen">
      <Sidebar
        selectedRegion={selectedRegion}
        showWaterPoints={showWaterPoints}
        onToggleWaterPoints={setShowWaterPoints}
        showWilayas={showWilayas}
        onToggleWilayas={setShowWilayas}
      />
      <main className="flex-1 relative">
        <MapView
          onRegionClick={setSelectedRegion}
          showWaterPoints={showWaterPoints}
          showWilayas={showWilayas}
        />
      </main>
    </div>
  )
}
