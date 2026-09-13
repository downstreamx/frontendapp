import { api, type ApiSuccess } from '@/lib/api'
export type CommercialKind = 'sales' | 'purchase'

const base = (kind: CommercialKind) =>
  kind === 'sales' ? '/sales/invoices' : '/purchase/invoices'

export async function listInvoices(kind: CommercialKind, params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>(base(kind), { params })
  return data.data
}

export async function getInvoice(kind: CommercialKind, id: string | number) {
  const { data } = await api.get<ApiSuccess<unknown>>(`${base(kind)}/${id}`)
  return data.data
}

export async function createInvoice(kind: CommercialKind, body: unknown) {
  const { data } = await api.post<ApiSuccess<unknown>>(base(kind), body)
  return data.data
}

export async function updateInvoice(
  kind: CommercialKind,
  id: string | number,
  body: unknown,
) {
  const { data } = await api.put<ApiSuccess<unknown>>(`${base(kind)}/${id}`, body)
  return data.data
}

export async function postInvoice(kind: CommercialKind, id: string | number) {
  const segment = kind === 'sales' ? 'sales/invoices' : 'purchase/invoices'
  const { data } = await api.post<ApiSuccess<unknown>>(`/${segment}/${id}/post`)
  return data.data
}

export async function fetchDepotProducts(depotId: string) {
  const { data } = await api.get<ApiSuccess<unknown[]>>('/product-service/items', {
    params: { depot_id: depotId },
  })
  return (data.data as { data?: unknown[] })?.data ?? data.data ?? []
}
