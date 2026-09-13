import { api, type ApiSuccess } from '@/lib/api'

export type SupplierCreditLimitMetrics = {
  credit_limit: number | null
  closing_balance: number
  available_credit: number
  over_credit_limit: boolean
  credit_limit_required: boolean
  debit_note_balance: number
  outstanding_balance: number
  opening_balance_net: number
}

export type SupplierCreditLimitStatus = SupplierCreditLimitMetrics & {
  proposed_amount: number
  projected_closing_balance: number
  can_post_credit_invoice: boolean
  shortfall: number
  message: string
}

export async function fetchSupplierCreditLimitStatus(
  supplierId: string | number,
  params?: { proposed_amount?: number; exclude_invoice_id?: number },
): Promise<SupplierCreditLimitStatus> {
  const { data } = await api.get<ApiSuccess<SupplierCreditLimitStatus>>(
    `/account/suppliers/${supplierId}/credit-limit-status`,
    {
      params: {
        proposed_amount: params?.proposed_amount,
        exclude_invoice_id: params?.exclude_invoice_id,
      },
    },
  )
  return data.data
}
