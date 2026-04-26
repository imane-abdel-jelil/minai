import { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import type { Region } from './data/mauritania-regions'

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)

  return (
    <div className="flex h-screen w-screen">
      <Sidebar selectedRegion={selectedRegion} />
      <main className="flex-1 relative">
        <MapView onRegionClick={setSelectedRegion} />
      </main>
    </div>
  )
}
