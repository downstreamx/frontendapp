import { api, type ApiSuccess } from '@/lib/api'
import type { CustomerCreditLimitMetrics } from './account-customer-credit-api'

export type CustomerBalanceMetrics = {
  outstanding_balance: number
  /** Unapplied credit note balance */
  available_credit: number
  credit_limit?: CustomerCreditLimitMetrics
  total_invoiced?: number
  total_returns?: number
  total_paid?: number
  as_of_date?: string
}

export type CustomerBalanceSummaryRow = {
  customer_id: number
  user_id: number
  customer_name: string
  customer_email?: string | null
  customer_code?: string | null
  total_invoiced: number
  total_returns: number
  net_invoiced: number
  total_paid: number
  balance: number
  available_credit: number
}

export type CustomerBalanceSummary = {
  customers: CustomerBalanceSummaryRow[]
  total_balance: number
  as_of_date: string
}

export async function fetchCustomerBalanceSummary(params?: {
  as_of_date?: string
  show_zero_balances?: boolean
}): Promise<CustomerBalanceSummary> {
  const { data } = await api.get<ApiSuccess<CustomerBalanceSummary>>(
    '/account/reports/customer-balance',
    {
      params: {
        as_of_date: params?.as_of_date,
        show_zero_balances: params?.show_zero_balances ? '1' : '0',
      },
    },
  )
  return data.data
}

export async function fetchCustomerBalance(
  customerId: string | number,
  asOfDate?: string,
): Promise<CustomerBalanceMetrics> {
  const { data } = await api.get<ApiSuccess<CustomerBalanceMetrics>>(
    `/account/customers/${customerId}/balance`,
    { params: asOfDate ? { as_of_date: asOfDate } : undefined },
  )
  return data.data
}
