import { api, type ApiSuccess } from '@/lib/api'

/** Shared TanStack Query helpers for Workdo module REST endpoints. */
export function createModuleListQuery<T>(path: string, queryKey: string[]) {
  return {
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ data: T[] }>>(path)
      return data.data
    },
  }
}
