import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import Stepper from '../components/Stepper'
import TimerRing from '../components/TimerRing'
import { api, type WorkoutSet } from '../lib/api'
import { fmtDuration, fmtNumber } from '../lib/format'
import { outbox } from '../lib/outbox'
import { useNow } from '../lib/useNow'
import { useWakeLock } from '../lib/useWakeLock'
import { useWorkouts } from '../lib/useWorkouts'
import { uuid } from '../lib/uuid'

const REST_TARGET_S = 120
const WEIGHT_STEP = 2.5

export default function Workout() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const navigate = useNavigate()
  const now = useNow()
  useWakeLock()

  const { data: all } = useWorkouts()
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises,
  })
  const workout = all?.find((w) => w.id === id)
  const history = all ?? []

  const [chosenId, setChosenId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState<{ key: string; weight: number; reps: number } | null>(null)

  // ---- وضعیت مشتق‌شده ----
  const sets = workout?.sets ?? []
  const activeSet = sets.find((s) => s.ended_at === null) ?? null
  const lastEnded = [...sets].reverse().find((s) => s.ended_at !== null) ?? null
  const currentId = activeSet?.exercise_id ?? chosenId ?? sets.at(-1)?.exercise_id ?? null
  const exercise = exercises.find((e) => e.id === currentId)
  const exSets = sets.filter((s) => s.exercise_id === currentId)

  let lastSet: WorkoutSet | null = null
  if (currentId) {
    const pools = [sets, ...history.filter((w) => w.id !== id).map((w) => w.sets)]
    outer: for (const pool of pools) {
      for (let i = pool.length - 1; i >= 0; i--) {
        const s = pool[i]
        if (s.exercise_id === currentId && s.ended_at && s.reps != null) {
          lastSet = s
          break outer
        }
      }
    }
  }

  const prefillKey = `${currentId}:${activeSet?.id ?? 'rest'}:${lastSet?.id ?? 'none'}`
  const baseWeight = activeSet ? (activeSet.weight_kg ?? 0) : (lastSet?.weight_kg ?? 0)
  const baseReps = lastSet?.reps ?? 8
  const weight = draft?.key === prefillKey ? draft.weight : baseWeight
  const reps = draft?.key === prefillKey ? draft.reps : baseReps
  const adjust = (patch: Partial<{ weight: number; reps: number }>) =>
    setDraft({ key: prefillKey, weight, reps, ...patch })

  // ---- عمل‌ها: فقط وارد صف می‌شن ----
  const onMainButton = () => {
    navigator.vibrate?.(25)
    const at = new Date().toISOString()
    if (activeSet) {
      outbox.enqueue({
        type: 'updateSet',
        workoutId: id,
        setId: activeSet.id,
        patch: { ended_at: at, reps, weight_kg: weight },
      })
    } else if (currentId) {
      outbox.enqueue({
        type: 'startSet',
        workoutId: id,
        set: { id: uuid(), exercise_id: currentId, started_at: at, weight_kg: weight },
      })
    }
  }

  const onFinish = () => {
    outbox.enqueue({
      type: 'finishWorkout',
      workoutId: id,
      ended_at: new Date().toISOString(),
    })
    navigate('/')
  }

  if (!all) return <p className="text-muted">{t('today.loading')}</p>
  if (!workout) return <p className="text-muted">{t('workout.notFound')}</p>

  const name = (e: typeof exercise) => (e ? (isFa ? e.name_fa : e.name_en) : '')
  const plus = exercise?.kind === 'bodyweight' ? '+' : ''
  const wr = (w: number | null, r: number | null) =>
    `${plus}${fmtNumber(w ?? 0)} × ${fmtNumber(r ?? 0)}`

  // ---- انتخاب حرکت ----
   if (!currentId || picking) {
    const discard = () => {
      outbox.enqueue({ type: 'deleteWorkout', workoutId: id })
      navigate('/')
    }
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-11 items-center justify-between">
          <button
            type="button"
            onClick={() => (picking ? setPicking(false) : navigate('/'))}
            aria-label={t('workout.back')}
            className="-ms-3 flex h-11 w-11 items-center justify-center"
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
          </button>
          {sets.length === 0 && (
            <button
              type="button"
              onClick={discard}
              className="h-11 px-1 text-[15px] font-medium text-danger"
            >
              {t('workout.discard')}
            </button>
          )}
        </div>
        <h1 className="text-[28px] leading-tight font-bold">{t('workout.choose')}</h1>
        <ul className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  setChosenId(ex.id)
                  setPicking(false)
                }}
                className="flex h-14 w-full items-center rounded-2xl border border-line bg-surface px-4 text-start text-[15px]"
              >
                {name(ex)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
    
    
  const toSec = (ms: number) => Math.max(0, Math.floor(ms / 1000))
  const workoutSec = toSec(now - new Date(workout.started_at).getTime())
  const restStart = lastEnded?.ended_at
    ? new Date(lastEnded.ended_at).getTime()
    : new Date(workout.started_at).getTime()
  const restSec = toSec(now - restStart)
  const setSec = activeSet ? toSec(now - new Date(activeSet.started_at).getTime()) : 0

  const ring = activeSet
    ? {
        time: fmtDuration(setSec),
        caption: t('workout.inSet'),
        progress: (setSec % 60) / 60,
        active: true,
      }
    : {
        time: fmtDuration(restSec),
        caption: `${t('workout.resting')} · ${t('workout.target', { time: fmtDuration(REST_TARGET_S) })}`,
        progress: restSec / REST_TARGET_S,
        active: false,
      }

  const chip = 'min-w-20 shrink-0 rounded-xl px-3 py-2 text-center text-xs'

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex h-11 items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={t('workout.back')}
          className="-ms-3 flex h-11 w-11 items-center justify-center"
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
        </button>
        <div className="text-[13px] text-muted tabular-nums" dir="ltr">
          {fmtDuration(workoutSec)}
        </div>
        <button
          type="button"
          onClick={onFinish}
          disabled={activeSet !== null}
          className="h-11 px-1 text-[15px] font-medium text-danger disabled:opacity-40"
        >
          {t('workout.finish')}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {exSets.map((s,i) => {
          const live = s.id === activeSet?.id
          return (
            <div
              key={s.id}
              className={`${chip} ${live ? 'border-2 border-accent text-accent' : 'bg-surface'}`}
            >
              <div className={live ? '' : 'text-muted'}>
                {t('workout.set', { n: fmtNumber(i + 1) })}
              </div>
              <div className={live ? 'text-white' : ''}>
                {s.ended_at ? wr(s.weight_kg, s.reps) : '…'}
              </div>
            </div>
          )
        })}
        {!activeSet && (
          <div className={`${chip} border-2 border-accent text-accent`}>
            <div>{t('workout.set', { n: fmtNumber(exSets.length + 1) })}</div>
            <div className="text-white">{t('workout.next')}</div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[28px] leading-tight font-bold">{name(exercise)}</h1>
          {!activeSet && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="h-11 shrink-0 text-sm text-accent"
            >
              {t('workout.change')}
            </button>
          )}
        </div>
        {lastSet && (
          <p className="mt-1 text-[13px] text-muted">
            {t('workout.last')}: {wr(lastSet.weight_kg, lastSet.reps)} {t('common.kg')}
          </p>
        )}
      </div>

      <TimerRing {...ring} />

      <div className="flex gap-3">
        <Stepper
          label={t('workout.weight')}
          value={`${plus}${fmtNumber(weight, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
          unit={t('common.kg')}
          onMinus={() => adjust({ weight: Math.max(0, +(weight - WEIGHT_STEP).toFixed(2)) })}
          onPlus={() => adjust({ weight: +(weight + WEIGHT_STEP).toFixed(2) })}
        />
        <Stepper
          label={t('workout.reps')}
          value={fmtNumber(reps)}
          onMinus={() => adjust({ reps: Math.max(0, reps - 1) })}
          onPlus={() => adjust({ reps: Math.min(100, reps + 1) })}
        />
      </div>

      <button
        type="button"
        onClick={onMainButton}
        className={`mt-auto flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl text-lg font-bold text-bg active:scale-[0.98] ${
          activeSet ? 'bg-danger' : 'bg-accent'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {activeSet ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M7 4l13 8-13 8z" />
          )}
        </svg>
        {activeSet
          ? t('workout.stop')
          : t('workout.start', { n: fmtNumber(exSets.length + 1) })}
      </button>
    </div>
  )
}
