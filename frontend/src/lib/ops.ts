import type { Workout, WorkoutSet } from './api'

export type OpBody =
  | { type: 'startWorkout'; workout: { id: string; started_at: string } }
  | { type: 'finishWorkout'; workoutId: string; ended_at: string }
  | {
      type: 'startSet'
      workoutId: string
      set: { id: string; exercise_id: string; started_at: string; weight_kg: number }
    }
  | {
      type: 'updateSet'
      workoutId: string
      setId: string
      patch: { ended_at?: string; reps?: number; weight_kg?: number }
    }
  | { type: 'deleteSet'; workoutId: string; setId: string }
  | { type: 'deleteWorkout'; workoutId: string }

export type Op = OpBody & { opId: string }


export function applyOps(base: Workout[], ops: Op[]): Workout[] {
  let list = base
  for (const op of ops) {
    switch (op.type) {
      case 'startWorkout':
        if (!list.some((w) => w.id === op.workout.id)) {
          list = [{ ...op.workout, ended_at: null, notes: null, sets: [] }, ...list]
        }
        break
      case 'finishWorkout':
        list = list.map((w) => (w.id === op.workoutId ? { ...w, ended_at: op.ended_at } : w))
        break
      case 'startSet':
        list = list.map((w) => {
          if (w.id !== op.workoutId || w.sets.some((s) => s.id === op.set.id)) return w
          const set: WorkoutSet = {
            id: op.set.id,
            workout_id: w.id,
            exercise_id: op.set.exercise_id,
            set_number: w.sets.filter((s) => s.exercise_id === op.set.exercise_id).length + 1,
            set_type: 'working',
            started_at: op.set.started_at,
            ended_at: null,
            reps: null,
            weight_kg: op.set.weight_kg,
            bodyweight_kg: null,
            rpe: null,
            rest_before_s: null,
            duration_s: null,
          }
          return { ...w, sets: [...w.sets, set] }
        })
        break
      case 'updateSet':
        list = list.map((w) =>
          w.id !== op.workoutId
            ? w
            : { ...w, sets: w.sets.map((s) => (s.id === op.setId ? { ...s, ...op.patch } : s)) },
        )
        break
      case 'deleteSet':
        list = list.map((w) =>
          w.id !== op.workoutId
            ? w
            : { ...w, sets: w.sets.filter((s) => s.id !== op.setId) },
        )
        break
      case 'deleteWorkout':
        list = list.filter((w) => w.id !== op.workoutId)
        break	
    }
  }
  return list
}
