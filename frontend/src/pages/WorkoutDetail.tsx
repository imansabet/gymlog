import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Stepper from '../components/Stepper'
import { api, type WorkoutSet } from '../lib/api'
import { fmtDate, fmtDuration, fmtNumber } from '../lib/format'
import { outbox } from '../lib/outbox'
import { useWorkouts } from '../lib/useWorkouts'

type RowProps = { set: WorkoutSet; index: number; plus: string; workoutId: string }

function SetRow({ set, index, plus, workoutId }: RowProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(0)

  const seconds = set.ended_at
    ? Math.round((new Date(set.ended_at).getTime() - new Date(set.started_at).getTime()) / 1000)
    : null

  const open = () => {
    setWeight(set.weight_kg ?? 0)
    setReps(set.reps ?? 0)
    setEditing(true)
  }
  const save = () => {
    outbox.enqueue({
      type: 'updateSet',
      workoutId,
      setId: set.id,
      patch: { reps, weight_kg: weight },
    })
    setEditing(false)
  }
  const remove = () => {
    if (!window.confirm(t('history.confirmDeleteSet'))) return
    outbox.enqueue({ type: 'deleteSet', workoutId, setId: set.id })
  }

  return (
    <li className="flex flex-col gap-3 py-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted">
            {t('workout.set', { n: fmtNumber(index + 1) })}
          </span>
          <span className="text-[17px] font-medium">
            {plus}
            {fmtNumber(set.weight_kg ?? 0)} × {set.reps === null ? '—' : fmtNumber(set.reps)}
            <span className="ms-2 text-[13px] font-normal text-muted">{t('common.kg')}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {seconds !== null && (
            <span className="text-[13px] text-muted" dir="ltr">
              {fmtDuration(seconds)}
            </span>
          )}
          <button
            type="button"
            onClick={editing ? () => setEditing(false) : open}
            className="h-11 px-1 text-sm text-accent"
          >
            {editing ? t('common.cancel') : t('history.edit')}
          </button>
        </div>
      </div>

      {editing && (
        <>
          <div className="flex gap-3">
            <Stepper
              label={t('workout.weight')}
              value={`${plus}${fmtNumber(weight, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
              unit={t('common.kg')}
              onMinus={() => setWeight(Math.max(0, +(weight - 2.5).toFixed(2)))}
              onPlus={() => setWeight(+(weight + 2.5).toFixed(2))}
            />
            <Stepper
              label={t('workout.reps')}
              value={fmtNumber(reps)}
              onMinus={() => setReps(Math.max(0, reps - 1))}
              onPlus={() => setReps(Math.min(100, reps + 1))}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              className="h-12 flex-1 rounded-xl bg-accent font-bold text-bg"
            >
              {t('history.save')}
            </button>
            <button
              type="button"
              onClick={remove}
              className="h-12 flex-1 rounded-xl border border-line font-medium text-danger"
            >
              {t('history.delete')}
            </button>
          </div>
        </>
      )}
    </li>
  )
}

export default function WorkoutDetail() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const navigate = useNavigate()
  const { data: all } = useWorkouts()
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises,
  })
  const workout = all?.find((w) => w.id === id)

  if (!all) return <p className="text-muted">{t('today.loading')}</p>
  if (!workout) return <p className="text-muted">{t('workout.notFound')}</p>

  // گروه‌بندی ست‌ها بر اساس حرکت، به ترتیب اولین ظهور
  const groups = new Map<string, WorkoutSet[]>()
  for (const s of workout.sets) {
    groups.set(s.exercise_id, [...(groups.get(s.exercise_id) ?? []), s])
  }

  const removeWorkout = () => {
    if (!window.confirm(t('history.confirmDeleteWorkout'))) return
    outbox.enqueue({ type: 'deleteWorkout', workoutId: id })
    navigate('/history')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1">
        <Link
          to="/history"
          aria-label={t('workout.back')}
          className="-ms-3 flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="rtl:rotate-180"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">
          {fmtDate(workout.started_at, { dateStyle: 'full', timeStyle: 'short' })}
        </h1>
      </div>

      {[...groups].map(([eid, sets]) => {
        const ex = exercises.find((e) => e.id === eid)
        const plus = ex?.kind === 'bodyweight' ? '+' : ''
        return (
          <section key={eid} className="rounded-2xl border border-line bg-surface px-4 pt-4">
            <h2 className="text-lg font-bold">{ex ? (isFa ? ex.name_fa : ex.name_en) : ''}</h2>
            <ul className="divide-y divide-line">
              {sets.map((s, i) => (
                <SetRow key={s.id} set={s} index={i} plus={plus} workoutId={id} />
              ))}
            </ul>
          </section>
        )
      })}

      <button
        type="button"
        onClick={removeWorkout}
        className="h-12 rounded-xl text-sm font-medium text-danger"
      >
        {t('history.deleteWorkout')}
      </button>
    </div>
  )
}
