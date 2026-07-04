/**
 * DashboardCharts — mini bibliothèque de charts SVG pour le dashboard.
 *
 * Trois composants légers :
 *   - <DonutChart /> — répartition en anneau
 *   - <LineChart /> — évolution temporelle avec area fill
 *   - <TopVillagesList /> — classement barres horizontales
 *
 * SVG pur, aucune dépendance externe. Rendu sombre futuriste (glow
 * subtil, teintes fluos).
 */
import { useMemo } from 'react'

// ═══════════════════════════════════════════════════════════════════
// DONUT CHART
// ═══════════════════════════════════════════════════════════════════

interface DonutSegment {
  label: string
  value: number
  color: string
}

export function DonutChart({
  segments,
  size = 140,
  thickness = 14,
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  const arcs = segments.map((s, i) => {
    const share = total > 0 ? s.value / total : 0
    const dashLength = share * circumference
    const arc = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={s.color}
        strokeWidth={thickness}
        strokeDasharray={`${dashLength} ${circumference}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    )
    offset += dashLength
    return arc
  })

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* Track de fond */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={thickness}
      />
      {arcs}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LINE CHART
// ═══════════════════════════════════════════════════════════════════

interface LineChartPoint {
  label: string
  value: number
}

export function LineChart({
  points,
  height = 180,
  color = '#10b981',
}: {
  points: LineChartPoint[]
  height?: number
  color?: string
}) {
  const width = 640
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30
  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  const { path, area, yTicks, xLabels, pointsPixel } = useMemo(() => {
    if (points.length === 0) {
      return { path: '', area: '', yTicks: [] as { y: number; label: string }[], xLabels: [] as { x: number; label: string }[], pointsPixel: [] as { x: number; y: number }[] }
    }
    const values = points.map((p) => p.value)
    const maxV = Math.max(...values, 1)
    const stepX = chartW / Math.max(points.length - 1, 1)

    const pointsPixel = points.map((p, i) => ({
      x: paddingLeft + i * stepX,
      y: paddingTop + chartH - (p.value / maxV) * chartH,
    }))

    const path = pointsPixel
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')

    const area =
      pointsPixel
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ') +
      ` L ${paddingLeft + (points.length - 1) * stepX} ${paddingTop + chartH}` +
      ` L ${paddingLeft} ${paddingTop + chartH} Z`

    const yTicks: { y: number; label: string }[] = []
    const ticksCount = 4
    for (let i = 0; i <= ticksCount; i++) {
      const v = (maxV * i) / ticksCount
      yTicks.push({
        y: paddingTop + chartH - (v / maxV) * chartH,
        label: formatTick(v),
      })
    }

    const xLabels = points.map((p, i) => ({
      x: paddingLeft + i * stepX,
      label: p.label,
    }))

    return { path, area, yTicks, xLabels, pointsPixel }
  }, [points, chartH, chartW])

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid horizontal */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={t.y}
            y2={t.y}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="2 3"
          />
          <text
            x={paddingLeft - 8}
            y={t.y + 3}
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
            textAnchor="end"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={height - 8}
          fill="rgba(255,255,255,0.4)"
          fontSize="11"
          textAnchor="middle"
        >
          {l.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={area} fill="url(#area-fill)" />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {pointsPixel.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="7" fill={color} opacity="0.15" />
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
        </g>
      ))}
    </svg>
  )
}

function formatTick(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v.toFixed(0)
}

// ═══════════════════════════════════════════════════════════════════
// TOP VILLAGES LIST (barres horizontales rank)
// ═══════════════════════════════════════════════════════════════════

interface TopVillage {
  name: string
  value: number
}

export function TopVillagesList({
  items,
  unit = 'm³',
}: {
  items: TopVillage[]
  unit?: string
}) {
  const maxV = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-medium truncate">
              {item.name}
            </div>
            <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${(item.value / maxV) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-white/70 text-[13px] font-semibold tabular-nums shrink-0">
            {item.value.toLocaleString('fr-FR')} {unit}
          </div>
        </div>
      ))}
    </div>
  )
}
