import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { fmtDate, fmtNumber } from '../lib/format'
import { outbox } from '../lib/outbox'
import { useWorkouts } from '../lib/useWorkouts'
import { uuid } from '../lib/uuid'

export default function Today() {
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const navigate = useNavigate()
  const { data: workouts, isLoading, isError } = useWorkouts()

  const open = workouts?.find((w) => w.ended_at === null)
  const recent = workouts?.filter((w) => w.ended_at !== null).slice(0, 5) ?? []

  const start = () => {
    const id = uuid()
    outbox.enqueue({
      type: 'startWorkout',
      workout: { id, started_at: new Date().toISOString() },
    })
    navigate(`/workout/${id}`)
  }

  const cta =
    'flex h-16 w-full items-center justify-center rounded-2xl bg-accent text-lg font-bold text-bg active:scale-[0.98]'

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-muted">{fmtDate(new Date(), { dateStyle: 'full' })}</p>
          <h1 className="mt-1 text-[34px] leading-tight font-bold">{t('today.title')}</h1>
        </div>
        <button
          type="button"
          onClick={() => i18n.changeLanguage(isFa ? 'en' : 'fa')}
          aria-label={t('settings.language')}
          className="h-11 min-w-11 rounded-xl border border-line px-3 text-sm font-medium"
        >
          {isFa ? 'EN' : 'فا'}
        </button>
      </header>

      {open ? (
        <Link to={`/workout/${open.id}`} className={cta}>
          {t('today.resume')}
        </Link>
      ) : (
        <button type="button" onClick={start} className={cta}>
          {t('today.start')}
        </button>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-[11px] tracking-widest text-muted rtl:tracking-normal">
          {t('today.recent')}
        </h2>
        {isLoading && <p className="text-muted">{t('today.loading')}</p>}
        {isError && <p className="text-danger">{t('today.error')}</p>}
        {workouts && recent.length === 0 && <p className="text-muted">{t('today.empty')}</p>}
        <ul className="flex flex-col gap-3 text-[15px]">
          {recent.map((w) => (
            <li key={w.id} className="flex justify-between">
              <span>{fmtDate(w.started_at)}</span>
              <span className="text-muted">
                {t('today.setsCount', { n: fmtNumber(w.sets.length) })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
