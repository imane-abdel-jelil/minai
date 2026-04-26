import { MAURITANIA_REGIONS, type Region, getScoreColor, getScoreLabel } from '../data/mauritania-regions'

interface Props {
  selectedRegion: Region | null
}

export default function Sidebar({ selectedRegion }: Props) {
  const totalRural = MAURITANIA_REGIONS.reduce((s, r) => s + r.ruralPopulation, 0)
  const avgScore = Math.round(
    MAURITANIA_REGIONS.reduce((s, r) => s + r.waterAccessScore, 0) / MAURITANIA_REGIONS.length
  )
  const criticalPeople = MAURITANIA_REGIONS
    .filter((r) => r.waterAccessScore < 35)
    .reduce((s, r) => s + r.ruralPopulation, 0)
  const totalPriority = MAURITANIA_REGIONS.reduce((s, r) => s + r.priorityVillages, 0)

  return (
    <aside className="w-96 bg-water-900 text-white overflow-y-auto p-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">MINAI</h1>
        <p className="text-xs opacity-70 leading-tight">
          Mauritanie INtelligence Artificielle<br/>
          Cartographie de l'accès à l'eau potable
        </p>
      </header>

      <section>
        <h2 className="text-sm uppercase tracking-wide opacity-60 mb-2">Vue nationale</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pop. rurale" value={totalRural.toLocaleString('fr-FR')} />
          <Stat label="Score moyen" value={`${avgScore}/100`} />
          <Stat label="En zone critique" value={criticalPeople.toLocaleString('fr-FR')} accent="bg-red-500/30" />
          <Stat label="Villages prioritaires" value={totalPriority.toString()} accent="bg-orange-500/30" />
        </div>
      </section>

      {selectedRegion ? (
        <section className="rounded-lg p-4 bg-water-700/40 border border-water-300/30">
          <h2 className="text-lg font-bold">{selectedRegion.name}</h2>
          <p className="text-xs opacity-70 mb-3">Capitale : {selectedRegion.capital}</p>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: getScoreColor(selectedRegion.waterAccessScore) }}
            />
            <span className="font-semibold">{selectedRegion.waterAccessScore}/100</span>
            <span className="text-xs opacity-70">— {getScoreLabel(selectedRegion.waterAccessScore)}</span>
          </div>

          <dl className="text-sm space-y-1">
            <Row label="Population totale" value={selectedRegion.population.toLocaleString('fr-FR')} />
            <Row label="Population rurale" value={selectedRegion.ruralPopulation.toLocaleString('fr-FR')} />
            <Row label="Distance moyenne au pt d'eau" value={`${selectedRegion.avgDistanceToWater} km`} />
            <Row label="Villages prioritaires" value={selectedRegion.priorityVillages.toString()} />
          </dl>
        </section>
      ) : (
        <section className="text-sm opacity-70 italic">
          Clique sur une région pour voir ses détails.
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide opacity-60 mb-2">Légende</h2>
        <div className="space-y-1 text-sm">
          <LegendItem color="#ef4444" label="Critique (&lt; 35)" />
          <LegendItem color="#f97316" label="Préoccupant (35–55)" />
          <LegendItem color="#eab308" label="Acceptable (55–75)" />
          <LegendItem color="#22c55e" label="Bon (≥ 75)" />
        </div>
      </section>

      <footer className="mt-auto text-xs opacity-50">
        Démo v0.1 — données estimatives. Sources réelles : WPDx, INSAE, OMS.
      </footer>
    </aside>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`rounded-lg p-3 ${accent ?? 'bg-water-700/40'}`}>
      <div className="text-[10px] uppercase opacity-70">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="opacity-70">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  )
}
