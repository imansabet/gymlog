import { useQuery } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import { api } from './api'
import { applyOps } from './ops'
import { outbox } from './outbox'

export const useOutbox = () => useSyncExternalStore(outbox.subscribe, outbox.getSnapshot)


export function useWorkouts() {
  const query = useQuery({ queryKey: ['workouts'], queryFn: api.workouts })
  const ops = useOutbox()
  const data = useMemo(
    () => (query.data || ops.length > 0 ? applyOps(query.data ?? [], ops) : undefined),
    [query.data, ops],
  )
  return { data, isError: query.isError && data === undefined, isLoading: data === undefined && query.isLoading }
}
