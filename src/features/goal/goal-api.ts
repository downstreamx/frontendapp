import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type GoalRow = {
  id: number
  goal_name: string
  goal_description?: string
  category_id?: number
  goal_type?: string
  target_amount?: string | number
  current_amount?: string | number
  start_date?: string
  target_date?: string
  priority?: string
  status?: string
  category?: { id?: number; category_name?: string } | null
}

export type GoalMeta = {
  goal_categories: Array<{ id: number; name: string; code?: string }>
  goal_types: string[]
}

export type GoalsIndexMeta = GoalMeta & {
  statuses: string[]
  priorities: string[]
}

export async function fetchGoalMeta(): Promise<GoalMeta> {
  const { data } = await api.get<ApiSuccess<GoalMeta>>('/goal/create-meta')
  return data.data
}

export async function fetchGoalsIndexMeta(): Promise<GoalsIndexMeta> {
  const { data } = await api.get<ApiSuccess<GoalsIndexMeta>>('/goal/goals/index-meta')
  return data.data
}

export async function listGoalsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<GoalRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/goal/goals', { params })
  return extractPaginatedList<GoalRow>(data)
}

export async function createGoal(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<GoalRow>>('/goal/goals', payload)
  return data.data
}

export async function updateGoal(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<GoalRow>>(`/goal/goals/${id}`, payload)
  return data.data
}

export async function getGoal(id: number) {
  const { data } = await api.get<ApiSuccess<GoalRow>>(`/goal/goals/${id}`)
  return data.data
}

export async function deleteGoal(id: number) {
  await api.delete(`/goal/goals/${id}`)
}
