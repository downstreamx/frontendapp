import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type CalendarEventRow = {
  id: string
  source_id?: number
  title: string
  name?: string
  start_date?: string
  end_date?: string
  start_time?: string | null
  type?: string
  status?: string
  module?: string
  color?: string
}

export type CalendarEventsIndexMeta = {
  modules: string[]
  types: string[]
}

export async function fetchCalendarEventsIndexMeta() {
  const { data } = await api.get<ApiSuccess<CalendarEventsIndexMeta>>('/calendar/events/index-meta')
  return data.data
}

export async function listCalendarEventsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<CalendarEventRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/calendar/events', { params })
  return extractPaginatedList<CalendarEventRow>(data)
}
