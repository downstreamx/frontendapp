import { api, type ApiSuccess } from '@/lib/api'

export type CustomerCreditLimitMetrics = {
  credit_limit: number | null
  closing_balance: number
  available_credit: number
  over_credit_limit: boolean
  credit_limit_required: boolean
  credit_note_balance: number
  outstanding_balance: number
  opening_balance_net: number
}

export type CustomerCreditLimitStatus = CustomerCreditLimitMetrics & {
  proposed_amount: number
  projected_closing_balance: number
  can_post_credit_invoice: boolean
  shortfall: number
  message: string
}

export async function fetchCustomerCreditLimitStatus(
  customerId: string | number,
  params?: { proposed_amount?: number; exclude_invoice_id?: number },
): Promise<CustomerCreditLimitStatus> {
  const { data } = await api.get<ApiSuccess<CustomerCreditLimitStatus>>(
    `/account/customers/${customerId}/credit-limit-status`,
    {
      params: {
        proposed_amount: params?.proposed_amount,
        exclude_invoice_id: params?.exclude_invoice_id,
      },
    },
  )
  return data.data
}
