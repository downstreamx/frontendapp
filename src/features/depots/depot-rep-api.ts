import { api, submitFormDataUpdate, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type {
  EmployeeCreateMeta,
  EmployeeDetail,
  EmployeeRow,
} from '@/features/hrm/hrm-api'

export type DepotRepsIndexMeta = {
  branches: Array<{ id: number; branch_name: string }>
  departments: Array<{ id: number; department_name: string; branch_id?: number }>
  designations: Array<{ id: number; designation_name: string; branch_id?: number; department_id?: number }>
}

export type DepotRepCreateMeta = EmployeeCreateMeta & {
  depot_rep_designation_id: number
}

export type DepotRepEditMeta = {
  employee: EmployeeDetail
  depot_rep_designation_id: number
  branches: DepotRepsIndexMeta['branches']
  departments: DepotRepsIndexMeta['departments']
  designations: DepotRepsIndexMeta['designations']
  shifts: Array<{ id: number; shift_name: string }>
  document_types: Array<{ id: number; document_name: string; is_required?: boolean }>
}

export async function fetchDepotRepsIndexMeta() {
  const { data } = await api.get<ApiSuccess<DepotRepsIndexMeta>>('/hrm/depot-reps/index-meta')
  return data.data
}

export async function listDepotRepsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmployeeRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/depot-reps', { params })
  return extractPaginatedList<EmployeeRow>(data)
}

export async function fetchDepotRepCreateMeta() {
  const { data } = await api.get<ApiSuccess<DepotRepCreateMeta>>('/hrm/depot-reps/create-meta')
  return data.data
}

export async function fetchDepotRepEditMeta(id: number | string) {
  const { data } = await api.get<ApiSuccess<DepotRepEditMeta>>(`/hrm/depot-reps/${id}/edit-meta`)
  return data.data
}

export async function fetchDepotRep(id: number | string) {
  const { data } = await api.get<ApiSuccess<EmployeeDetail>>(`/hrm/depot-reps/${id}`)
  return data.data
}

export async function createDepotRep(formData: FormData) {
  const { data } = await api.post<ApiSuccess<EmployeeDetail>>('/hrm/depot-reps', formData)
  return data.data
}

export async function updateDepotRep(id: number | string, formData: FormData) {
  return submitFormDataUpdate<EmployeeDetail>(`/hrm/depot-reps/${id}`, formData)
}
