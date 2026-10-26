type Props = {
  progress: number // 0..1
  time: string
  caption: string
  active: boolean 
}

export default function TimerRing({ progress, time, caption, active }: Props) {
  const r = 88
  const c = 2 * Math.PI * r
  const p = Math.min(Math.max(progress, 0), 1)

  return (
    <div className="relative mx-auto h-[200px] w-[200px] shrink-0">
      <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r={r} fill="none" className="stroke-line" strokeWidth="10" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          className={active ? 'stroke-danger' : 'stroke-accent'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" role="timer">
        <div className="text-5xl font-bold tabular-nums" dir="ltr">
          {time}
        </div>
        <div className="px-6 text-center text-[13px] text-muted">{caption}</div>
      </div>
    </div>
  )
}
