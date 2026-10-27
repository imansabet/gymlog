import { del, get, set } from 'idb-keyval'
import { api, ApiError, type Workout } from './api'
import { applyOps, type Op, type OpBody } from './ops'
import { queryClient } from './queryClient'
import { uuid } from './uuid'

const KEY = 'gymlog-outbox'
const FAILED_KEY = 'gymlog-failed'

let ops: Op[] = []
let flushing = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())
const persist = () => set(KEY, ops)

async function send(op: Op) {
  switch (op.type) {
    case 'startWorkout':
      await api.startWorkout(op.workout)
      break
    case 'finishWorkout':
      await api.finishWorkout(op.workoutId, op.ended_at)
      break
    case 'startSet':
      await api.startSet(op.workoutId, op.set)
      break
    case 'updateSet':
      await api.updateSet(op.setId, op.patch)
      break
    case 'deleteSet':
      await api.deleteSet(op.setId)
      break
    case 'deleteWorkout':
      await api.deleteWorkout(op.workoutId)
      break   
  }
}


function isRetryable(e: unknown) {
  if (e instanceof ApiError) return e.status >= 500 || e.status === 408 || e.status === 429
  return true
}

async function keepFailed(op: Op, error: unknown) {
  const prev = (await get<unknown[]>(FAILED_KEY)) ?? []
  await set(FAILED_KEY, [...prev, { op, error: String(error), at: new Date().toISOString() }])
}


function foldIntoCache(op: Op) {
  queryClient.setQueryData<Workout[]>(['workouts'], (cur) => (cur ? applyOps(cur, [op]) : cur))
}

async function flush() {
  if (flushing || ops.length === 0) return
  flushing = true
  let sent = false
  try {
    while (ops.length > 0) {
      const op = ops[0]
      try {
        await send(op)
        foldIntoCache(op)
        sent = true
      } catch (e) {
        if (isRetryable(e)) break
        await keepFailed(op, e)
      }
      ops = ops.slice(1)
      emit()
      await persist()
    }
  } finally {
    flushing = false
  }
  if (sent && ops.length === 0) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workouts'] }),
      queryClient.invalidateQueries({ queryKey: ['progress'] }),
    ])
  }
}

export const outbox = {
  subscribe: (fn: () => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  getSnapshot: () => ops,

  enqueue(op: OpBody) {
    ops = [...ops, { ...op, opId: uuid() }]
    emit()
    void persist()
    void flush()
  },

  async init() {
    try {
      ops = (await get<Op[]>(KEY)) ?? []
    } catch {
      ops = [] 
    }
    emit()
    window.addEventListener('online', () => void flush())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void flush()
    })
    setInterval(() => void flush(), 15_000)
    void flush()
  },

  
  async clearFailed() {
    await del(FAILED_KEY)
  },
}
