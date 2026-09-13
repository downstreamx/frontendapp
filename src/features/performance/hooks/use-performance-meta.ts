import { useQuery } from '@tanstack/react-query'
import {
  fetchEmployeeGoalsIndexMeta,
  fetchEmployeeReviewsIndexMeta,
  fetchIndicatorsIndexMeta,
  fetchReviewCyclesIndexMeta,
} from '../performance-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useIndicatorsIndexMeta() {
  const query = useQuery({
    queryKey: ['performance', 'indicators', 'index-meta'],
    queryFn: fetchIndicatorsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const categoryOptions: LookupOption[] =
    meta?.indicator_categories.map((c) => ({ id: c.id, label: c.name })) ?? []

  return { ...query, meta, categoryOptions }
}

export function useReviewCyclesIndexMeta() {
  const query = useQuery({
    queryKey: ['performance', 'review-cycles', 'index-meta'],
    queryFn: fetchReviewCyclesIndexMeta,
    staleTime: 60_000,
  })
  return { ...query, meta: query.data }
}

export function useEmployeeGoalsIndexMeta() {
  const query = useQuery({
    queryKey: ['performance', 'employee-goals', 'index-meta'],
    queryFn: fetchEmployeeGoalsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const employeeOptions: LookupOption[] =
    meta?.employees.map((e) => ({ id: e.id, label: e.name })) ?? []
  const goalTypeOptions: LookupOption[] =
    meta?.goal_types.map((g) => ({ id: g.id, label: g.name })) ?? []

  return { ...query, meta, employeeOptions, goalTypeOptions }
}

export function useEmployeeReviewsIndexMeta() {
  const query = useQuery({
    queryKey: ['performance', 'employee-reviews', 'index-meta'],
    queryFn: fetchEmployeeReviewsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const employeeOptions: LookupOption[] =
    meta?.employees.map((e) => ({ id: e.id, label: e.name })) ?? []
  const reviewCycleOptions: LookupOption[] =
    meta?.review_cycles.map((c) => ({ id: c.id, label: c.name })) ?? []

  return { ...query, meta, employeeOptions, reviewCycleOptions }
}
