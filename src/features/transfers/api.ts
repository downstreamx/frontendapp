import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'

export type Transfer = {
  id: number
  from_depot: number
  to_depot: number
  product_id: number
  quantity: number | string
  status?: string
  notes?: string | null
  from_depot_relation?: { id: number; name: string }
  to_depot_relation?: { id: number; name: string }
  product?: { id: number; name: string }
}

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function listTransfers(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/transfers', {
    params: { per_page: 100, ...params },
  })
  return extractListRows(data.data) as Transfer[]
}

export async function getTransfer(id: string | number) {
  const { data } = await api.get<ApiSuccess<Transfer>>(`/transfers/${id}`)
  return unwrap(data.data)
}

export async function createTransfer(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<Transfer>>('/transfers', body)
  return unwrap(data.data)
}

export async function postTransfer(id: string | number) {
  const { data } = await api.post<ApiSuccess<Transfer>>(`/transfers/${id}/post`)
  return unwrap(data.data)
}
