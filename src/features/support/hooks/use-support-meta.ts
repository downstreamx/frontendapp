import { useQuery } from '@tanstack/react-query'
import { fetchSupportMeta } from '../support-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useSupportMeta() {
  const query = useQuery({
    queryKey: ['support-ticket', 'create-meta'],
    queryFn: fetchSupportMeta,
    staleTime: 60_000,
  })

  const categoryOptions: LookupOption[] =
    query.data?.categories.map((c) => ({ id: c.id, label: c.name })) ?? []

  return { ...query, categoryOptions }
}
