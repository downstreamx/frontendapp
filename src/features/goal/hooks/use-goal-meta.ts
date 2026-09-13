import { useQuery } from '@tanstack/react-query'
import { fetchGoalMeta, fetchGoalsIndexMeta } from '../goal-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useGoalMeta() {
  const query = useQuery({
    queryKey: ['goal', 'create-meta'],
    queryFn: fetchGoalMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const categoryOptions: LookupOption[] =
    meta?.goal_categories.map((c) => ({ id: c.id, label: c.name })) ?? []

  const goalTypeOptions: LookupOption[] =
    meta?.goal_types.map((t) => ({ id: t, label: t.replace(/_/g, ' ') })) ?? []

  return { ...query, meta, categoryOptions, goalTypeOptions }
}

export function useGoalsIndexMeta() {
  const query = useQuery({
    queryKey: ['goal', 'goals', 'index-meta'],
    queryFn: fetchGoalsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const categoryOptions: LookupOption[] =
    meta?.goal_categories.map((c) => ({ id: c.id, label: c.name })) ?? []

  const goalTypeOptions: LookupOption[] =
    meta?.goal_types.map((t) => ({ id: t, label: t.replace(/_/g, ' ') })) ?? []

  return { ...query, meta, categoryOptions, goalTypeOptions }
}
