import { useQuery } from '@tanstack/react-query'
import { fetchTimesheetsIndexMeta } from '../timesheet-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useTimesheetsIndexMeta() {
  const query = useQuery({
    queryKey: ['timesheet', 'timesheets', 'index-meta'],
    queryFn: fetchTimesheetsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const userOptions: LookupOption[] =
    meta?.users.map((u) => ({ id: u.id, label: u.name })) ?? []

  return { ...query, meta, userOptions }
}
