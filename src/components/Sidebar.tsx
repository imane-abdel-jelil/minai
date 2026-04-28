import { MAURITANIA_REGIONS, type Region, getScoreColor, getScoreLabel } from '../data/mauritania-regions'
import type { WilayaStats } from '../lib/geo'
import { computeNationalScore, type ComputedScore } from '../lib/score'

interface Props {
  selectedRegion: Region | null
  showWaterPoints: boolean
  onToggleWaterPoints: (v: boolean) => void
  showWilayas: boolean
  onToggleWilayas: (v: boolean) => void
  wilayaStats: Record<string, WilayaStats>
  kindFilters: Record<string, boolean>
  onToggleKind: (kind: string) => void
  onSetAllKinds: (value: boolean) => void
  kindCounts: Record<string, number>
  computedScores: Record<string, ComputedScore>
}

const KIND_LABELS: Record<string, string> = {
  drinking_water: 'Eau potable / fontaines',
  water_point: 'Points d’eau',
  well: 'Puits',
  borehole: 'Forages',
  spring: 'Sources',
  tap: 'Robinets',
  water_works: 'Stations de pompage',
  other: 'Autres',
}

// Couleurs alignées sur la couche Mapbox 'water-unclustered'
const KIND_COLORS: Record<string, string> = {
  drinking_water: '#06b6d4',
  water_point: '#06b6d4',
  well: '#f59e0b',
  borehole: '#10b981',
  spring: '#14b8a6',
  tap: '#3b82f6',
  water_works: '#8b5cf6',
  other: '#9ca3af',
}

// Ordre d'affichage des filtres
const KIND_ORDER = [
  'drinking_water',
  'water_point',
  'well',
  'borehole',
  'spring',
  'tap',
  'water_works',
  'other',
]

export default function Sidebar({
  selectedRegion,
  showWaterPoints,
  onToggleWaterPoints,
  showWilayas,
  onToggleWilayas,
  wilayaStats,
  kindFilters,
  onToggleKind,
  onSetAllKinds,
  kindCounts,
  computedScores,
}: Props) {
  const visibleKinds = KIND_ORDER.filter((k) => (kindCounts[k] ?? 0) > 0)
  const totalShown = visibleKinds.reduce(
    (s, k) => s + (kindFilters[k] !== false ? kindCounts[k] || 0 : 0),
    0
  )
  const totalAll = visibleKinds.reduce((s, k) => s + (kindCounts[k] || 0), 0)
  const allEnabled = visibleKinds.every((k) => kindFilters[k] !== false)
  const noneEnabled = visibleKinds.every((k) => kindFilters[k] === false)
  const totalCounted = Object.values(wilayaStats).reduce((s, v) => s + v.total, 0)
  const totalRural = MAURITANIA_REGIONS.reduce((s, r) => s + r.ruralPopulation, 0)

  // Score national pondéré + comptes critiques basés sur les scores LIVE
  const avgScore = computeNationalScore(computedScores)
  const criticalPeople = MAURITANIA_REGIONS
    .filter((r) => (computedScores[r.id]?.score ?? r.waterAccessScore) < 35)
    .reduce((s, r) => s + r.ruralPopulation, 0)
  const totalPriority = MAURITANIA_REGIONS.reduce((s, r) => s + r.priorityVillages, 0)

  const selectedScore = selectedRegion ? computedScores[selectedRegion.id] : null

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

      {/* Toggles couches carto */}
      <section className="rounded-lg bg-water-700/40 p-3 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex-1">
            <div className="text-sm font-semibold">Frontières des wilayas</div>
            <div className="text-[11px] opacity-70 leading-tight">
              13 régions administratives, colorées par score
            </div>
          </div>
          <Switch checked={showWilayas} onChange={onToggleWilayas} />
        </label>

        <div className="border-t border-white/10" />

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex-1">
            <div className="text-sm font-semibold">Points d'eau réels</div>
            <div className="text-[11px] opacity-70 leading-tight">
              2 770 points (puits, forages, fontaines, sources)<br/>
              Source : OpenStreetMap
            </div>
          </div>
          <Switch checked={showWaterPoints} onChange={onToggleWaterPoints} />
        </label>
      </section>

      {selectedRegion ? (
        <section className="rounded-lg p-4 bg-water-700/40 border border-water-300/30">
          <h2 className="text-lg font-bold">{selectedRegion.name}</h2>
          <p className="text-xs opacity-70 mb-3">Capitale : {selectedRegion.capital}</p>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{
                background: selectedScore?.color ?? getScoreColor(selectedRegion.waterAccessScore),
              }}
            />
            <span className="font-semibold">
              {(selectedScore?.score ?? selectedRegion.waterAccessScore)}/100
            </span>
            <span className="text-xs opacity-70">
              — {selectedScore?.label ?? getScoreLabel(selectedRegion.waterAccessScore)}
            </span>
            {selectedScore?.fromData === false && (
              <span className="text-[10px] opacity-50 italic ml-auto">estimation</span>
            )}
          </div>

          <dl className="text-sm space-y-1">
            <Row label="Population totale" value={selectedRegion.population.toLocaleString('fr-FR')} />
            <Row label="Population rurale" value={selectedRegion.ruralPopulation.toLocaleString('fr-FR')} />
            <Row label="Distance moyenne au pt d'eau" value={`${selectedRegion.avgDistanceToWater} km`} />
            <Row label="Villages prioritaires" value={selectedRegion.priorityVillages.toString()} />
          </dl>

          {wilayaStats[selectedRegion.id] && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
                Points d'eau dans cette wilaya
              </div>
              <div className="text-2xl font-bold leading-tight">
                {wilayaStats[selectedRegion.id].total.toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] opacity-70 mb-2">
                points référencés (OpenStreetMap)
              </div>
              {Object.keys(wilayaStats[selectedRegion.id].byKind).length > 0 && (
                <ul className="text-xs space-y-0.5 opacity-90">
                  {Object.entries(wilayaStats[selectedRegion.id].byKind)
                    .sort((a, b) => b[1] - a[1])
                    .map(([kind, n]) => (
                      <li key={kind} className="flex justify-between">
                        <span className="opacity-80">
                          {KIND_LABELS[kind] || kind}
                        </span>
                        <span className="font-medium">{n}</span>
                      </li>
                    ))}
                </ul>
              )}
              {selectedScore?.peoplePerPoint != null && (
                <div className="text-[11px] opacity-70 mt-2 leading-snug">
                  ≈ <span className="font-medium">1 point d'eau</span> pour{' '}
                  <span className="font-medium">
                    {selectedScore.peoplePerPoint.toLocaleString('fr-FR')}
                  </span>{' '}
                  habitants ruraux
                  <br />
                  <span className="opacity-70">
                    (cible Sphere : 1 pour 500)
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="text-sm opacity-70 italic">
          Clique sur une région pour voir ses détails.
          {totalCounted > 0 && (
            <div className="not-italic opacity-100 text-xs mt-2 opacity-70">
              {totalCounted.toLocaleString('fr-FR')} points d'eau localisés dans les 13 wilayas.
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide opacity-60 mb-2">Score d'accès</h2>
        <div className="space-y-1 text-sm">
          <LegendItem color="#ef4444" label="Critique (&lt; 35)" />
          <LegendItem color="#f97316" label="Préoccupant (35–55)" />
          <LegendItem color="#eab308" label="Acceptable (55–75)" />
          <LegendItem color="#22c55e" label="Bon (≥ 75)" />
        </div>
        <details className="mt-2 text-[11px] opacity-60">
          <summary className="cursor-pointer hover:opacity-100">
            Comment le score est calculé
          </summary>
          <p className="mt-2 leading-snug">
            Densité de points d'eau OSM par habitant rural, comparée à la cible
            humanitaire <span className="italic">Sphere</span> : 1 point pour
            500 personnes. Score = 100 quand la cible est atteinte.
          </p>
          <p className="mt-1 leading-snug">
            Limite : OSM mesure la <span className="italic">couverture
            cartographique</span>, pas la couverture réelle. WPDx (statut
            fonctionnel) viendra affiner ça.
          </p>
        </details>
      </section>

      {showWaterPoints && visibleKinds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wide opacity-60">
              Filtres par type
            </h2>
            <div className="text-[10px] opacity-60 tabular-nums">
              {totalShown.toLocaleString('fr-FR')} / {totalAll.toLocaleString('fr-FR')}
            </div>
          </div>

          <div className="flex gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => onSetAllKinds(true)}
              disabled={allEnabled}
              className="text-[11px] px-2 py-0.5 rounded bg-water-700/40 hover:bg-water-700/70 disabled:opacity-40 disabled:hover:bg-water-700/40 transition-colors"
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => onSetAllKinds(false)}
              disabled={noneEnabled}
              className="text-[11px] px-2 py-0.5 rounded bg-water-700/40 hover:bg-water-700/70 disabled:opacity-40 disabled:hover:bg-water-700/40 transition-colors"
            >
              Aucun
            </button>
          </div>

          <ul className="space-y-1 text-sm">
            {visibleKinds.map((kind) => {
              const enabled = kindFilters[kind] !== false
              const count = kindCounts[kind] || 0
              return (
                <li key={kind}>
                  <button
                    type="button"
                    onClick={() => onToggleKind(kind)}
                    aria-pressed={enabled}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors text-left ${
                      enabled
                        ? 'bg-water-700/40 hover:bg-water-700/70'
                        : 'bg-transparent opacity-40 hover:opacity-70'
                    }`}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-white/30"
                      style={{
                        background: enabled ? KIND_COLORS[kind] : 'transparent',
                        borderColor: KIND_COLORS[kind],
                      }}
                    />
                    <span className="flex-1 truncate">
                      {KIND_LABELS[kind] || kind}
                    </span>
                    <span className="text-xs opacity-70 tabular-nums">
                      {count.toLocaleString('fr-FR')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <footer className="mt-auto text-xs opacity-50">
        Démo v0.2 — points d'eau réels via OSM (Overpass).<br/>
        Sources estimées : INSAE, OMS, WPDx (à venir).
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

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${
        checked ? 'bg-cyan-500' : 'bg-water-300/30'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
