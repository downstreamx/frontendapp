import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type DepotRepAssignmentsIndexMeta = {
  depots: Array<{ id: number; name: string; city?: string }>
  depot_reps: Array<{
    id: number
    name: string
    email?: string
    first_name?: string
    last_name?: string
    user_id?: number
  }>
}

export type DepotRepAssignmentRow = {
  id: number
  depot_id: number
  employee_id: number
  depot?: { id: number; name: string; city?: string }
  employee?: {
    id: number
    user?: {
      id: number
      name?: string
      email?: string
      first_name?: string
      last_name?: string
      avatar?: string | null
    }
  }
}

export async function fetchDepotRepAssignmentsIndexMeta() {
  const { data } = await api.get<ApiSuccess<DepotRepAssignmentsIndexMeta>>(
    '/depot-rep-assignments/index-meta',
  )
  return data.data
}

export async function listDepotRepAssignmentsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<DepotRepAssignmentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/depot-rep-assignments', { params })
  return extractPaginatedList<DepotRepAssignmentRow>(data)
}

export async function createDepotRepAssignment(body: { depot_id: number; employee_id: number }) {
  const { data } = await api.post<ApiSuccess<DepotRepAssignmentRow>>('/depot-rep-assignments', body)
  return { row: data.data, message: data.message }
}

export async function deleteDepotRepAssignment(id: number | string) {
  await api.delete(`/depot-rep-assignments/${id}`)
}
