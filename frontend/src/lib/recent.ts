import type { Workout } from './api'

export function recentExerciseIds(workouts: Workout[], limit = 5): string[] {
  const ids: string[] = []
  for (const w of workouts) {
    for (let i = w.sets.length - 1; i >= 0; i--) {
      const id = w.sets[i].exercise_id
      if (!ids.includes(id)) ids.push(id)
      if (ids.length >= limit) return ids
    }
  }
  return ids
}
