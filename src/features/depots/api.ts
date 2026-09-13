import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'

export type Depot = {
  id: number
  name: string
  contact_person?: string | null
  address: string
  city: string
  state?: string | null
  country?: string | null
  zip_code: string
  phone?: string | null
  email?: string | null
  is_active: boolean
  is_system?: boolean
}

export type DepotProductStock = {
  product_id: number
  name?: string | null
  sku?: string | null
  unit?: string | null
  type?: string | null
  quantity: number
}

export type DepotDetail = Depot & {
  products?: DepotProductStock[]
}

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function listDepots(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/depots', {
    params: { per_page: 100, ...params },
  })
  return extractListRows(data.data) as Depot[]
}

export async function getDepot(id: string | number) {
  const { data } = await api.get<ApiSuccess<DepotDetail>>(`/depots/${id}`)
  return unwrap(data.data)
}

export async function createDepot(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<Depot>>('/depots', body)
  return unwrap(data.data)
}

export async function updateDepot(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<Depot>>(`/depots/${id}`, body)
  return unwrap(data.data)
}
