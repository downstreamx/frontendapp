import { useQuery } from '@tanstack/react-query'
import { fetchFormsIndexMeta } from '../form-builder-api'

export function useFormsMeta() {
  return useQuery({
    queryKey: ['form-builder', 'forms', 'index-meta'],
    queryFn: fetchFormsIndexMeta,
    staleTime: 60_000,
  })
}
