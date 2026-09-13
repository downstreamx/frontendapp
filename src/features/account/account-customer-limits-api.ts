import { api, type ApiSuccess } from '@/lib/api'
import type { PaginatedListMeta } from '@/components/ui/pagination'

export type CustomerLimitsBalanceRow = {
  id: number
  user_id?: number | null
  customer_code?: string
  company_name: string
  contact_person_email?: string
  credit_limit: number | null
  opening_balance_debit: number
  opening_balance_credit: number
  opening_balance_as_of?: string | null
  outstanding_balance: number
  credit_note_balance: number
  available_credit: number
  closing_balance: number
  available_credit_headroom: number | null
  over_credit_limit: boolean
  credit_limit_required?: boolean
}

export type CustomerLimitsBalancesResult = {
  rows: CustomerLimitsBalanceRow[]
  meta: PaginatedListMeta
  as_of_date: string
}

export async function fetchCustomerLimitsBalances(params: {
  as_of_date?: string
  search?: string
  per_page?: string
  page?: string
}): Promise<CustomerLimitsBalancesResult> {
  const { data } = await api.get<
    ApiSuccess<{
      data: CustomerLimitsBalanceRow[]
      meta: PaginatedListMeta
      as_of_date: string
    }>
  >('/account/customers/limits-balances', { params })

  const body = data.data
  return {
    rows: body.data ?? [],
    meta: body.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: body.data?.length ?? 0,
      total: body.data?.length ?? 0,
      from: body.data?.length ? 1 : 0,
      to: body.data?.length ?? 0,
    },
    as_of_date: body.as_of_date,
  }
}

export async function patchSupplierOpeningBalance(
  supplierId: string | number,
  payload: {
    opening_balance_debit?: number
    opening_balance_credit?: number
    opening_balance_as_of?: string
  },
) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/account/suppliers/${supplierId}/opening-balance`,
    payload,
  )
  return data.data
}
