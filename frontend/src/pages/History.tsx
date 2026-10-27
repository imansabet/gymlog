import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { fmtDate, fmtNumber } from '../lib/format'
import { useWorkouts } from '../lib/useWorkouts'

export default function History() {
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const { data: workouts, isLoading } = useWorkouts()
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises,
  })

  const nameOf = (id: string) => {
    const e = exercises.find((x) => x.id === id)
    return e ? (isFa ? e.name_fa : e.name_en) : ''
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[34px] leading-tight font-bold">{t('nav.history')}</h1>
      {isLoading && <p className="text-muted">{t('today.loading')}</p>}
      {workouts && workouts.length === 0 && <p className="text-muted">{t('today.empty')}</p>}

      <ul className="flex flex-col gap-3">
        {workouts?.map((w) => {
          const names = [...new Set(w.sets.map((s) => nameOf(s.exercise_id)))].filter(Boolean)
          const minutes = w.ended_at
            ? Math.round(
                (new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) / 60000,
              )
            : null
          return (
            <li key={w.id}>
              <Link
                to={`/history/${w.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium">
                    {fmtDate(w.started_at, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="shrink-0 text-[13px] text-muted">
                    {t('today.setsCount', { n: fmtNumber(w.sets.length) })}
                    {minutes !== null && ` · ${fmtNumber(minutes)} ${t('common.min')}`}
                  </span>
                </div>
                <div className="truncate text-[13px] text-muted">
                  {names.join(isFa ? '، ' : ', ')}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
