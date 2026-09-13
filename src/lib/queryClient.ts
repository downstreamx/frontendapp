import { QueryClient } from '@tanstack/react-query'

/**
 * Query key convention: `['domain', 'resource', ...params]`.
 * Use helpers from `@/lib/query-keys` for commercial, bridging, and auth caches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
