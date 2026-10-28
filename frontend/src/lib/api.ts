export type Exercise = {
  id: string
  slug: string
  name_en: string
  name_fa: string
  kind: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'band'
}

export type ProgressPoint = {
  workout_id: string
  date: string
  sets: number
  top_weight_kg: number
  top_reps: number
  est_1rm_kg: number
  volume: number
}




export type WorkoutSet = {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  set_type: 'warmup' | 'working'
  started_at: string
  ended_at: string | null
  reps: number | null
  weight_kg: number | null
  bodyweight_kg: number | null
  rpe: number | null
  rest_before_s: number | null
  duration_s: number | null
}

export type Workout = {
  id: string
  started_at: string
  ended_at: string | null
  notes: string | null
  sets: WorkoutSet[]
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000), 
    ...init,
  })
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
})

export const api = {
  exercises: () => request<Exercise[]>('/exercises'),
  workouts: () => request<Workout[]>('/workouts?limit=30'),
  workout: (id: string) => request<Workout>(`/workouts/${id}`),
  startWorkout: (body: { id: string; started_at: string }) =>
    request<Workout>('/workouts', json('POST', body)),
  finishWorkout: (id: string, ended_at: string) =>
    request<Workout>(`/workouts/${id}`, json('PATCH', { ended_at })),
  startSet: (
    workoutId: string,
    body: { id: string; exercise_id: string; started_at: string; weight_kg: number },
  ) => request<WorkoutSet>(`/workouts/${workoutId}/sets`, json('POST', body)),
  updateSet: (
    id: string,
    body: { ended_at?: string; reps?: number; weight_kg?: number },
  ) => request<WorkoutSet>(`/sets/${id}`, json('PATCH', body)),
  deleteSet: (id: string) => request<void>(`/sets/${id}`, { method: 'DELETE' }),
  deleteWorkout: (id: string) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),
  progress: (exerciseId: string, days: number | null) =>
    request<ProgressPoint[]>(
      `/exercises/${exerciseId}/progress${days ? `?days=${days}` : ''}`,
    ),	  
}
