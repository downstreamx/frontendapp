import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type IndicatorRow = {
  id: number
  category_id: number
  name: string
  description?: string
  measurement_unit?: string
  target_value?: string
  status?: string
  category?: { id: number; name: string } | null
}

export type IndicatorsIndexMeta = {
  statuses: string[]
  measurement_units: string[]
  indicator_categories: Array<{ id: number; name: string; status?: string }>
}

export type ReviewCycleRow = {
  id: number
  name: string
  frequency?: string
  description?: string
  status?: string
  employee_reviews_count?: number
}

export type EmployeeGoalRow = {
  id: number
  employee_id: number
  goal_type_id: number
  title: string
  description?: string
  start_date?: string
  end_date?: string
  target?: string | number
  progress?: string | number
  status?: string
  employee?: { id: number; name: string; email?: string } | null
  goal_type?: { id: number; name: string } | null
}

export type PerformanceIndicatorRatingRow = {
  id: number
  name: string
  user_rating: number
  category?: { name?: string | null } | null
}

export type EmployeeReviewRow = {
  id: number
  user_id: number
  reviewer_id: number
  review_cycle_id: number
  review_date?: string
  completion_date?: string | null
  status?: string
  pros?: string | null
  cons?: string | null
  rating?: Record<string, number> | null
  average_rating?: number | null
  performance_indicators_by_category?: Record<string, PerformanceIndicatorRatingRow[]>
  user?: { id: number; name: string; email?: string } | null
  reviewer?: { id: number; name: string; email?: string } | null
  review_cycle?: { id: number; name: string } | null
}

export type EmployeeReviewConductPayload = {
  review: EmployeeReviewRow
  performance_indicators_by_category: Record<string, PerformanceIndicatorRatingRow[]>
  existing_ratings: Record<string, number>
}

export type ReviewCyclesIndexMeta = {
  statuses: string[]
  frequencies: string[]
}

export type EmployeeGoalsIndexMeta = {
  statuses: string[]
  goal_types: Array<{ id: number; name: string }>
  employees: Array<{ id: number; name: string; email?: string }>
}

export type EmployeeReviewsIndexMeta = {
  statuses: string[]
  review_cycles: Array<{ id: number; name: string; frequency?: string; status?: string }>
  employees: Array<{ id: number; name: string; email?: string }>
}

export async function fetchIndicatorsIndexMeta(): Promise<IndicatorsIndexMeta> {
  const { data } = await api.get<ApiSuccess<IndicatorsIndexMeta>>('/performance/indicators/index-meta')
  return data.data
}

export async function listIndicatorsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<IndicatorRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/performance/indicators', { params })
  return extractPaginatedList<IndicatorRow>(data)
}

export async function createIndicator(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<IndicatorRow>>('/performance/indicators', payload)
  return data.data
}

export async function updateIndicator(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<IndicatorRow>>(`/performance/indicators/${id}`, payload)
  return data.data
}

export async function getIndicator(id: number) {
  const { data } = await api.get<ApiSuccess<IndicatorRow>>(`/performance/indicators/${id}`)
  return data.data
}

export async function deleteIndicator(id: number) {
  await api.delete(`/performance/indicators/${id}`)
}

export async function fetchReviewCyclesIndexMeta(): Promise<ReviewCyclesIndexMeta> {
  const { data } = await api.get<ApiSuccess<ReviewCyclesIndexMeta>>(
    '/performance/review-cycles/index-meta',
  )
  return data.data
}

export async function listReviewCyclesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<ReviewCycleRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/performance/review-cycles', { params })
  return extractPaginatedList<ReviewCycleRow>(data)
}

export async function createReviewCycle(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<ReviewCycleRow>>('/performance/review-cycles', payload)
  return data.data
}

export async function updateReviewCycle(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<ReviewCycleRow>>(`/performance/review-cycles/${id}`, payload)
  return data.data
}

export async function getReviewCycle(id: number) {
  const { data } = await api.get<ApiSuccess<ReviewCycleRow>>(`/performance/review-cycles/${id}`)
  return data.data
}

export async function deleteReviewCycle(id: number) {
  await api.delete(`/performance/review-cycles/${id}`)
}

export async function fetchEmployeeGoalsIndexMeta(): Promise<EmployeeGoalsIndexMeta> {
  const { data } = await api.get<ApiSuccess<EmployeeGoalsIndexMeta>>(
    '/performance/employee-goals/index-meta',
  )
  return data.data
}

export async function listEmployeeGoalsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmployeeGoalRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/performance/employee-goals', { params })
  return extractPaginatedList<EmployeeGoalRow>(data)
}

export async function createEmployeeGoal(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<EmployeeGoalRow>>('/performance/employee-goals', payload)
  return data.data
}

export async function updateEmployeeGoal(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<EmployeeGoalRow>>(
    `/performance/employee-goals/${id}`,
    payload,
  )
  return data.data
}

export async function getEmployeeGoal(id: number) {
  const { data } = await api.get<ApiSuccess<EmployeeGoalRow>>(`/performance/employee-goals/${id}`)
  return data.data
}

export async function deleteEmployeeGoal(id: number) {
  await api.delete(`/performance/employee-goals/${id}`)
}

export async function fetchEmployeeReviewsIndexMeta(): Promise<EmployeeReviewsIndexMeta> {
  const { data } = await api.get<ApiSuccess<EmployeeReviewsIndexMeta>>(
    '/performance/employee-reviews/index-meta',
  )
  return data.data
}

export async function listEmployeeReviewsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmployeeReviewRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/performance/employee-reviews', { params })
  return extractPaginatedList<EmployeeReviewRow>(data)
}

export async function createEmployeeReview(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<EmployeeReviewRow>>(
    '/performance/employee-reviews',
    payload,
  )
  return data.data
}

export async function updateEmployeeReview(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<EmployeeReviewRow>>(
    `/performance/employee-reviews/${id}`,
    payload,
  )
  return data.data
}

export async function getEmployeeReview(id: number) {
  const { data } = await api.get<ApiSuccess<EmployeeReviewRow>>(`/performance/employee-reviews/${id}`)
  return data.data
}

export async function deleteEmployeeReview(id: number) {
  await api.delete(`/performance/employee-reviews/${id}`)
}

export async function fetchEmployeeReviewConduct(id: number) {
  const { data } = await api.get<ApiSuccess<EmployeeReviewConductPayload>>(
    `/performance/employee-reviews/${id}/conduct`,
  )
  return data.data
}

export async function submitEmployeeReviewConduct(
  id: number,
  payload: { ratings: Record<string, number>; pros?: string; cons?: string },
) {
  const { data } = await api.post<ApiSuccess<EmployeeReviewRow>>(
    `/performance/employee-reviews/${id}/conduct`,
    payload,
  )
  return data.data
}
