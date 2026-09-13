import { useQuery } from '@tanstack/react-query'
import { fetchCustomPagesIndexMeta } from '../landing-page-api'

export function useCustomPagesMeta() {
  return useQuery({
    queryKey: ['landing-page', 'pages', 'index-meta'],
    queryFn: fetchCustomPagesIndexMeta,
    staleTime: 60_000,
  })
}
