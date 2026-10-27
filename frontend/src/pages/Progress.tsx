import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LineChart from '../components/LineChart'
import Segmented from '../components/Segmented'
import { api, type ProgressPoint } from '../lib/api'
import { fmtDate, fmtNumber } from '../lib/format'
import { useWorkouts } from '../lib/useWorkouts'

type Metric = 'top_weight_kg' | 'est_1rm_kg'

export default function Progress() {
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const { data: workouts } = useWorkouts()
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises,
  })

  const [exId, setExId] = useState<string | null>(null)
  const [days, setDays] = useState(90) // 0 = همه
  const [metric, setMetric] = useState<Metric>('top_weight_kg')

  // پیش‌فرض: آخرین حرکتی که کار کردی
  const lastUsed = workouts?.find((w) => w.sets.length > 0)?.sets.at(-1)?.exercise_id
  const selected = exId ?? lastUsed ?? exercises[0]?.id ?? null
  const exercise = exercises.find((e) => e.id === selected)

  const { data: points = [], isLoading } = useQuery({
    queryKey: ['progress', selected, days],
    queryFn: () => api.progress(selected!, days || null),
    enabled: selected !== null,
  })

  const plus = exercise?.kind === 'bodyweight' ? '+' : ''
  const fmtKg = (v: number) => `${plus}${fmtNumber(v)}`

  const best = points.reduce<ProgressPoint | null>(
    (b, p) =>
      !b ||
      p.top_weight_kg > b.top_weight_kg ||
      (p.top_weight_kg === b.top_weight_kg && p.top_reps > b.top_reps)
        ? p
        : b,
    null,
  )
  const records = [...points]
    .sort((a, b) => b.top_weight_kg - a.top_weight_kg || b.top_reps - a.top_reps)
    .slice(0, 5)
  const chartPoints = points.map((p) => ({ t: new Date(p.date).getTime(), v: p[metric] }))

  const label = 'text-[11px] tracking-widest text-muted rtl:tracking-normal'
  const card = 'rounded-2xl border border-line bg-surface'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[34px] leading-tight font-bold">{t('progress.title')}</h1>

      <select
        value={selected ?? ''}
        onChange={(e) => setExId(e.target.value)}
        aria-label={t('progress.exercise')}
        className="h-13 w-full rounded-2xl border border-line bg-surface px-4 text-base font-medium"
      >
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {isFa ? e.name_fa : e.name_en}
          </option>
        ))}
      </select>

      <Segmented
        value={days}
        onChange={setDays}
        options={[
          { value: 30, label: t('progress.r1m') },
          { value: 90, label: t('progress.r3m') },
          { value: 180, label: t('progress.r6m') },
          { value: 0, label: t('progress.rAll') },
        ]}
      />
      <Segmented
        value={metric}
        onChange={setMetric}
        options={[
          { value: 'top_weight_kg', label: t('progress.topWeight') },
          { value: 'est_1rm_kg', label: t('progress.est1rm') },
        ]}
      />

      {points.length === 0 ? (
        <p className="text-muted">{isLoading ? t('today.loading') : t('progress.empty')}</p>
      ) : (
        <>
          <div className="flex gap-3">
            <div className={`${card} flex-1 p-3.5`}>
              <div className={label}>{t('progress.best')}</div>
              <div className="mt-1.5 text-[22px] font-bold tabular-nums">
                {best && `${fmtKg(best.top_weight_kg)} × ${fmtNumber(best.top_reps)}`}
              </div>
            </div>
            <div className={`${card} flex-1 p-3.5`}>
              <div className={label}>{t('progress.sessions')}</div>
              <div className="mt-1.5 text-[22px] font-bold tabular-nums">
                {fmtNumber(points.length)}
              </div>
            </div>
          </div>

          <div className={`${card} p-3.5`}>
            <LineChart
              points={chartPoints}
              yLabel={(v) => fmtNumber(v)}
              xLabel={(ts) => fmtDate(new Date(ts), { month: 'short', day: 'numeric' })}
              ariaLabel={t('progress.chart')}
            />
          </div>

          <div className={`${card} p-4`}>
            <div className={`${label} mb-3`}>{t('progress.records')}</div>
            <ul className="flex flex-col gap-3 text-[15px]">
              {records.map((p) => (
                <li key={p.workout_id} className="flex justify-between">
                  <span className="font-medium tabular-nums">
                    {fmtKg(p.top_weight_kg)} × {fmtNumber(p.top_reps)}
                  </span>
                  <span className="text-muted">{fmtDate(p.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
