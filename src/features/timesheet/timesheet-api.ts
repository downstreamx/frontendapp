import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type TimesheetRow = {
  id: number
  user_id: number
  project_id?: number | null
  date?: string
  hours?: number
  minutes?: number
  notes?: string
  type?: string
  user?: { id: number; name: string; email?: string } | null
  project?: { id: number; name: string } | null
}

export type TimesheetsIndexMeta = {
  types: string[]
  users: Array<{ id: number; name: string; email?: string }>
}

export async function fetchTimesheetsIndexMeta(): Promise<TimesheetsIndexMeta> {
  const { data } = await api.get<ApiSuccess<TimesheetsIndexMeta>>('/timesheet/timesheets/index-meta')
  return data.data
}

export async function listTimesheetsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TimesheetRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/timesheet/timesheets', { params })
  return extractPaginatedList<TimesheetRow>(data)
}

export async function createTimesheet(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TimesheetRow>>('/timesheet/timesheets', payload)
  return data.data
}

export async function updateTimesheet(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TimesheetRow>>(`/timesheet/timesheets/${id}`, payload)
  return data.data
}

export async function getTimesheet(id: number) {
  const { data } = await api.get<ApiSuccess<TimesheetRow>>(`/timesheet/timesheets/${id}`)
  return data.data
}

export async function deleteTimesheet(id: number) {
  await api.delete(`/timesheet/timesheets/${id}`)
}
