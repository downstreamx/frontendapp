import { useQuery } from '@tanstack/react-query'
import { api, type ApiSuccess } from '@/lib/api'
import type { PaginatedListMeta } from '@/components/ui/pagination'

export type PaginatedListResult<T> = {
  rows: T[]
  meta: PaginatedListMeta
}

export function useResourceList<T = unknown>(
  key: string,
  endpoint: string,
  params?: Record<string, string | number | undefined>,
) {
  return useQuery({
    queryKey: [key, endpoint, params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ data: T[] } | T[]>>(endpoint, { params })
      return data.data
    },
  })
}

/** Normalize ApiResponse bodies and Laravel paginators into a row array. */
export function extractListRows<T = Record<string, unknown>>(payload: unknown): T[] {
  const rows = unwrapListPayload(payload)
  return rows as T[]
}

function unwrapListPayload(payload: unknown): Record<string, unknown>[] {
  if (payload == null) return []

  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[]
  }

  if (typeof payload !== 'object') return []

  const obj = payload as Record<string, unknown>

  if (obj.success === true && obj.data !== undefined) {
    return unwrapListPayload(obj.data)
  }

  if (Array.isArray(obj.data)) {
    return obj.data as Record<string, unknown>[]
  }

  return []
}

/** Laravel paginator inside ApiResponse `data`. */
export function extractPaginatedList<T = Record<string, unknown>>(
  payload: unknown,
): PaginatedListResult<T> {
  let body: Record<string, unknown> | null = null

  if (payload != null && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (obj.success === true && obj.data !== undefined) {
      body =
        typeof obj.data === 'object' && obj.data !== null
          ? (obj.data as Record<string, unknown>)
          : null
    } else if (Array.isArray(obj.data)) {
      return {
        rows: obj.data as T[],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: obj.data.length,
          total: obj.data.length,
          from: obj.data.length ? 1 : 0,
          to: obj.data.length,
        },
      }
    } else if ('current_page' in obj) {
      body = obj
    }
  }

  if (!body) {
    const rows = extractListRows<T>(payload)
    return {
      rows,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: rows.length,
        total: rows.length,
        from: rows.length ? 1 : 0,
        to: rows.length,
      },
    }
  }

  const rows = Array.isArray(body.data) ? (body.data as T[]) : extractListRows<T>(body)

  return {
    rows,
    meta: {
      current_page: Number(body.current_page ?? 1),
      last_page: Number(body.last_page ?? 1),
      per_page: Number(body.per_page ?? rows.length),
      total: Number(body.total ?? rows.length),
      from: Number(body.from ?? (rows.length ? 1 : 0)),
      to: Number(body.to ?? rows.length),
    },
  }
}
