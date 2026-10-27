type Pt = { t: number; v: number }

type Props = {
  points: Pt[]
  yLabel: (v: number) => string
  xLabel: (t: number) => string
  ariaLabel: string
}

const STEPS = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200]

export default function LineChart({ points, yLabel, xLabel, ariaLabel }: Props) {
  if (points.length === 0) return null

  const W = 340
  const H = 200
  const L = 40
  const R = 14
  const T = 14
  const B = 30

  const max = Math.max(...points.map((p) => p.v))
  const step = STEPS.find((s) => s * 4 >= max) ?? Math.ceil(max / 4)
  const vMax = step * 4
  const tMin = points[0].t
  const tMax = points[points.length - 1].t
  const single = tMax === tMin

  const x = (t: number) =>
    single ? (L + W - R) / 2 : L + ((t - tMin) / (tMax - tMin)) * (W - L - R)
  const y = (v: number) => T + (1 - v / vMax) * (H - T - B)

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(tMax).toFixed(1)} ${y(0)} L${x(tMin).toFixed(1)} ${y(0)} Z`
  const last = points[points.length - 1]

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1={L}
              x2={W - R}
              y1={y(step * i)}
              y2={y(step * i)}
              className="stroke-line"
              strokeWidth="1"
            />
            <text
              x={L - 6}
              y={y(step * i) + 4}
              textAnchor="end"
              className="fill-muted"
              fontSize="11"
            >
              {yLabel(step * i)}
            </text>
          </g>
        ))}

        <path d={area} className="fill-accent/10" />
        <path
          d={line}
          fill="none"
          className="stroke-accent"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(p.t)}
            cy={y(p.v)}
            r={i === points.length - 1 ? 5 : 3}
            className="fill-accent"
          />
        ))}

        <text
          x={x(last.t)}
          y={y(last.v) - 10}
          textAnchor={single ? 'middle' : 'end'}
          className="fill-white"
          fontSize="12"
          fontWeight="700"
        >
          {yLabel(last.v)}
        </text>

        <text
          x={x(tMin)}
          y={H - 8}
          textAnchor={single ? 'middle' : 'start'}
          className="fill-muted"
          fontSize="11"
        >
          {xLabel(tMin)}
        </text>
        {!single && (
          <text x={x(tMax)} y={H - 8} textAnchor="end" className="fill-muted" fontSize="11">
            {xLabel(tMax)}
          </text>
        )}
      </svg>
    </div>
  )
}
