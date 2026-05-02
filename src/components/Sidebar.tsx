import { MAURITANIA_REGIONS, type Region, getScoreColor, getScoreLabel } from '../data/mauritania-regions'
import type { Village } from '../data/mauritania-villages'
import type { WilayaStats } from '../lib/geo'
import { useI18n } from '../lib/i18n'
import { computeNationalScore, type ComputedScore } from '../lib/score'
import {
  recommendedDelay,
  statusColor,
  statusLabel,
  type VillageEval,
  type VillageStatus,
} from '../lib/villages'

interface Props {
  selectedRegion: Region | null
  selectedVillage: Village | null
  selectedVillageEval: VillageEval | null
  showWaterPoints: boolean
  onToggleWaterPoints: (v: boolean) => void
  showWilayas: boolean
  onToggleWilayas: (v: boolean) => void
  showVillages: boolean
  onToggleVillages: (v: boolean) => void
  wilayaStats: Record<string, WilayaStats>
  kindFilters: Record<string, boolean>
  onToggleKind: (kind: string) => void
  onSetAllKinds: (value: boolean) => void
  kindCounts: Record<string, number>
  computedScores: Record<string, ComputedScore>
  priorities: VillageEval[]
  convoyTarget: Village | null
  onTargetConvoy: (v: Village) => void
  onClearConvoy: () => void
  onSelectVillage: (v: Village | null) => void
  /** Fermeture de la sidebar sur mobile (drawer) */
  onCloseMobile?: () => void
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

const KIND_ORDER = [
  'drinking_water', 'water_point', 'well', 'borehole',
  'spring', 'tap', 'water_works', 'other',
]

export default function Sidebar({
  selectedRegion,
  selectedVillage,
  selectedVillageEval,
  showWaterPoints,
  onToggleWaterPoints,
  showWilayas,
  onToggleWilayas,
  showVillages,
  onToggleVillages,
  wilayaStats,
  kindFilters,
  onToggleKind,
  onSetAllKinds,
  kindCounts,
  computedScores,
  priorities,
  convoyTarget,
  onTargetConvoy,
  onClearConvoy,
  onSelectVillage,
  onCloseMobile,
}: Props) {
  const { t } = useI18n()
  const visibleKinds = KIND_ORDER.filter((k) => (kindCounts[k] ?? 0) > 0)
  const totalShown = visibleKinds.reduce(
    (s, k) => s + (kindFilters[k] !== false ? kindCounts[k] || 0 : 0),
    0
  )
  const totalAll = visibleKinds.reduce((s, k) => s + (kindCounts[k] || 0), 0)
  const allEnabled = visibleKinds.every((k) => kindFilters[k] !== false)
  const noneEnabled = visibleKinds.every((k) => kindFilters[k] === false)
  const totalRural = MAURITANIA_REGIONS.reduce((s, r) => s + r.ruralPopulation, 0)

  const avgScore = computeNationalScore(computedScores)
  const criticalPeople = MAURITANIA_REGIONS
    .filter((r) => (computedScores[r.id]?.score ?? r.waterAccessScore) < 35)
    .reduce((s, r) => s + r.ruralPopulation, 0)

  const selectedScore = selectedRegion ? computedScores[selectedRegion.id] : null

  // La recommandation principale = le village le plus prioritaire
  const topPriority = priorities[0] ?? null

  return (
    <aside className="h-full w-full md:w-96 bg-water-900 text-white overflow-y-auto p-6 flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">MINAI</h1>
          <p className="text-xs opacity-70 leading-tight">
            {t('Cartographie de l’accès à l’eau · Mauritanie')}
          </p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label={t('Fermer le panneau')}
            className="md:hidden -mt-1 -mr-1 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </header>

      {topPriority ? (
        <RecommendationCard
          evaluation={topPriority}
          isTargeted={convoyTarget?.id === topPriority.village.id}
          onTarget={() => onTargetConvoy(topPriority.village)}
          onClear={onClearConvoy}
        />
      ) : (
        <section className="rounded-lg p-4 bg-cyan-500/10 border border-cyan-300/30 text-sm opacity-70 italic">
          {t('Calcul des priorités en cours…')}
        </section>
      )}

      {priorities.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide opacity-70 mb-2 flex items-center gap-2">
            🔥 <span>{t('Zones prioritaires aujourd’hui')}</span>
          </h2>
          <ol className="space-y-2">
            {priorities.map((e, i) => {
              const isTarget = convoyTarget?.id === e.village.id
              return (
                <li key={e.village.id}>
                  <div
                    className={`rounded-md border transition-colors ${
                      isTarget
                        ? 'bg-cyan-500/30 border-cyan-300/60'
                        : 'bg-water-700/40 border-transparent hover:bg-water-700/60'
                    }`}
                  >
                    <button
                      onClick={() => onSelectVillage(e.village)}
                      className="w-full text-left p-2.5 flex items-start gap-2.5"
                    >
                      <span
                        className="mt-1 inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: statusColor(e.status) }}
                        title={statusLabel(e.status)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="opacity-60 font-mono text-[10px]">#{i + 1}</span>
                          <span className="font-semibold truncate">{e.village.name}</span>
                          <StatusPill status={e.status} />
                        </div>
                        <div className="text-[11px] opacity-75 mt-0.5">
                          {e.village.population.toLocaleString('fr-FR')}&nbsp;hab.
                          {' · '}
                          {Number.isFinite(e.distanceToWaterKm)
                            ? `${e.distanceToWaterKm.toFixed(1)} km à l’eau`
                            : 'distance inconnue'}
                        </div>
                      </div>
                    </button>
                    <div className="px-2.5 pb-2 -mt-1 flex gap-1.5">
                      <button
                        onClick={() => onTargetConvoy(e.village)}
                        className="text-[11px] px-2 py-0.5 rounded bg-water-900/60 hover:bg-water-900/80 transition"
                      >
                        {t('🚛 Tracer le convoi')}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. DÉTAIL DU VILLAGE SÉLECTIONNÉ
          ═══════════════════════════════════════════════════════════════ */}
      {selectedVillage && selectedVillageEval && (
        <section className="rounded-lg p-4 bg-water-700/50 border border-cyan-300/30">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {selectedVillage.name}
              </h2>
              <p className="text-xs opacity-70">
                {t('Wilaya :')} {regionName(selectedVillage.wilayaId)}
              </p>
            </div>
            <button
              onClick={() => onSelectVillage(null)}
              className="text-xs opacity-60 hover:opacity-100"
              title={t('Fermer le panneau')}
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: statusColor(selectedVillageEval.status) }}
            />
            <span className="font-semibold">
              {t(statusLabel(selectedVillageEval.status))}
            </span>
            <span className="ml-auto text-xs opacity-70">
              {t('Niveau d’urgence')}
            </span>
          </div>

          <dl className="text-sm space-y-1">
            <Row
              label={t('Population')}
              value={`${selectedVillage.population.toLocaleString('fr-FR')} ${t('habitants')}`}
            />
            <Row
              label={t('Distance au point d’eau')}
              value={
                Number.isFinite(selectedVillageEval.distanceToWaterKm)
                  ? `${selectedVillageEval.distanceToWaterKm.toFixed(1)} km`
                  : '—'
              }
            />
            <Row label={t('Dernière intervention')} value={t('Non renseignée')} />
          </dl>

          <p
            className="mt-3 px-3 py-2 rounded text-sm font-medium leading-snug"
            style={{
              background: `${statusColor(selectedVillageEval.status)}20`,
              color: statusColor(selectedVillageEval.status),
            }}
          >
            {t('Intervention recommandée')} {t(recommendedDelay(selectedVillageEval.status))}.
          </p>

          {convoyTarget?.id !== selectedVillage.id && (
            <button
              onClick={() => onTargetConvoy(selectedVillage)}
              className="mt-3 w-full bg-cyan-500/30 hover:bg-cyan-500/50 transition rounded py-2 text-sm font-medium"
            >
              {t('🚛 Cibler ce village pour le prochain convoi')}
            </button>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide opacity-60 mb-2">{t('Vue nationale')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t('Pop. rurale')} value={totalRural.toLocaleString('fr-FR')} />
          <Stat label={t('Score moyen')} value={`${avgScore}/100`} />
          <Stat label={t('En zone critique')} value={criticalPeople.toLocaleString('fr-FR')} accent="bg-red-500/30" />
          <Stat label={t('Villages suivis')} value={priorities.length > 0 ? '38+' : '…'} accent="bg-cyan-500/20" />
        </div>
      </section>

      {selectedRegion && (
        <details className="rounded-lg p-3 bg-water-700/30">
          <summary className="cursor-pointer text-sm font-semibold">
            {selectedRegion.name}
          </summary>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  background:
                    selectedScore?.color ?? getScoreColor(selectedRegion.waterAccessScore),
                }}
              />
              <span className="font-semibold">
                {selectedScore?.score ?? selectedRegion.waterAccessScore}/100
              </span>
              <span className="text-xs opacity-70">
                — {selectedScore?.label ?? getScoreLabel(selectedRegion.waterAccessScore)}
              </span>
            </div>
            <Row label={t('Population')} value={selectedRegion.population.toLocaleString('fr-FR')} />
            <Row label={t('Pop. rurale')} value={selectedRegion.ruralPopulation.toLocaleString('fr-FR')} />
            {wilayaStats[selectedRegion.id] && (
              <Row label={t('Points d’eau (OSM)')} value={wilayaStats[selectedRegion.id].total.toLocaleString('fr-FR')} />
            )}
          </div>
        </details>
      )}

      <section className="rounded-lg bg-water-700/40 p-3 space-y-3">
        <ToggleRow
          title={t('Villages')}
          subtitle={t('Localités évaluées (statut Critique / Risque / OK)')}
          checked={showVillages}
          onChange={onToggleVillages}
        />
        <Divider />
        <ToggleRow
          title={t('Frontières des wilayas')}
          subtitle={t('13 régions administratives, colorées par score')}
          checked={showWilayas}
          onChange={onToggleWilayas}
        />
        <Divider />
        <ToggleRow
          title={t('Points d’eau (OSM)')}
          subtitle={t('Puits, forages, fontaines, sources')}
          checked={showWaterPoints}
          onChange={onToggleWaterPoints}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. LÉGENDE STATUT VILLAGE
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-sm uppercase tracking-wide opacity-60 mb-2">{t('Statut village')}</h2>
        <ul className="space-y-1 text-sm">
          <LegendVillage status="critical" desc={t('distance > 5 km au point d’eau le plus proche')} />
          <LegendVillage status="risk"     desc={t('distance entre 2 et 5 km')} />
          <LegendVillage status="ok"       desc={t('distance ≤ 2 km')} />
        </ul>
        <details className="mt-2 text-[11px] opacity-60">
          <summary className="cursor-pointer hover:opacity-100">{t('Méthodologie')}</summary>
          <p className="mt-2 leading-snug">
            {t('Pour chaque village, on calcule la distance au point d’eau OSM le plus proche. Le statut est défini selon des seuils opérationnels sahéliens. La priorité est pondérée par la population du village.')}
          </p>
        </details>
      </section>

      {showWaterPoints && visibleKinds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wide opacity-60">
              {t('Filtres par type')}
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
              className="text-[11px] px-2 py-0.5 rounded bg-water-700/40 hover:bg-water-700/70 disabled:opacity-40 transition-colors"
            >
              {t('Tout')}
            </button>
            <button
              type="button"
              onClick={() => onSetAllKinds(false)}
              disabled={noneEnabled}
              className="text-[11px] px-2 py-0.5 rounded bg-water-700/40 hover:bg-water-700/70 disabled:opacity-40 transition-colors"
            >
              {t('Aucun')}
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
                      {t(KIND_LABELS[kind] || kind)}
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
        {t('Démo v0.4 · Villages curés + OSM Overpass.')}<br />
        {t('Sources : ANSADE · UNICEF/JMP · World Bank · OpenStreetMap.')}
      </footer>
    </aside>
  )
}

// ─── Composants internes ─────────────────────────────────────────────

function RecommendationCard({
  evaluation,
  isTargeted,
  onTarget,
  onClear,
}: {
  evaluation: VillageEval
  isTargeted: boolean
  onTarget: () => void
  onClear: () => void
}) {
  const { t } = useI18n()
  const { village, status, distanceToWaterKm } = evaluation
  return (
    <section
      className="rounded-lg p-4 border-2"
      style={{
        background: `${statusColor(status)}18`,
        borderColor: `${statusColor(status)}80`,
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
          {t('🚛 Recommandation MINAI')}
        </h2>
        {isTargeted && (
          <button
            onClick={onClear}
            className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition"
          >
            {t('Effacer')}
          </button>
        )}
      </div>

      <p className="text-[11px] opacity-70 mt-1 mb-3">
        {t('Prochaine intervention prioritaire selon les données disponibles.')}
      </p>

      <div className="text-base font-semibold leading-tight">
        → {village.name}
        <span className="text-xs opacity-70 font-normal ml-1.5">
          ({regionName(village.wilayaId)})
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        <RecommendationLine
          label={t('Distance au point d’eau')}
          value={
            Number.isFinite(distanceToWaterKm)
              ? `${distanceToWaterKm.toFixed(1)} km`
              : '—'
          }
        />
        <RecommendationLine
          label={t('Population')}
          value={`${village.population.toLocaleString('fr-FR')} ${t('habitants')}`}
        />
        <RecommendationLine label={t('Approvisionnement récent')} value={t('aucun renseigné')} />
      </ul>

      <p
        className="mt-3 text-sm font-medium"
        style={{ color: statusColor(status) }}
      >
        {t('Intervention recommandée')} {t(recommendedDelay(status))}.
      </p>

      <button
        onClick={onTarget}
        className={`mt-3 w-full rounded py-2 text-sm font-medium transition ${
          isTargeted
            ? 'bg-cyan-500/40 cursor-default'
            : 'bg-cyan-500/30 hover:bg-cyan-500/50'
        }`}
      >
        {isTargeted ? t('✓ Convoi tracé sur la carte') : t('🚛 Tracer le convoi sur la carte')}
      </button>
    </section>
  )
}

function RecommendationLine({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-xs opacity-70">{label}</span>
      <span className="font-medium tabular-nums text-right">{value}</span>
    </li>
  )
}

function StatusPill({ status }: { status: VillageStatus }) {
  const { t } = useI18n()
  return (
    <span
      className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded"
      style={{
        background: `${statusColor(status)}30`,
        color: statusColor(status),
      }}
    >
      {t(statusLabel(status))}
    </span>
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

function LegendVillage({ status, desc }: { status: VillageStatus; desc: string }) {
  const { t } = useI18n()
  return (
    <li className="flex items-start gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full mt-1 flex-shrink-0"
        style={{ background: statusColor(status) }}
      />
      <span>
        <span className="font-medium">{t(statusLabel(status))}</span>{' '}
        <span className="opacity-70">— {desc}</span>
      </span>
    </li>
  )
}

function ToggleRow({
  title, subtitle, checked, onChange,
}: { title: string; subtitle: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] opacity-70 leading-tight">{subtitle}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </label>
  )
}

function Divider() {
  return <div className="border-t border-white/10" />
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

function regionName(wilayaId: string): string {
  return MAURITANIA_REGIONS.find((r) => r.id === wilayaId)?.name ?? wilayaId
}
