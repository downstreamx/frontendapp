export type CreateTruckProviderPaymentPayload = {
  truck_provider_id: number
  payment_date: string
  amount: number
  reference_number?: string
  payment_method?: string
  narration?: string
  receipt?: File | null
}

export function buildCreateTruckProviderPaymentFormData(
  body: CreateTruckProviderPaymentPayload,
): FormData {
  const formData = new FormData()
  formData.append('truck_provider_id', String(body.truck_provider_id))
  formData.append('payment_date', body.payment_date)
  formData.append('amount', String(body.amount))

  if (body.reference_number) {
    formData.append('reference_number', body.reference_number)
  }
  if (body.payment_method) {
    formData.append('payment_method', body.payment_method)
  }
  if (body.narration) {
    formData.append('narration', body.narration)
  }
  if (body.receipt) {
    formData.append('receipt', body.receipt)
  }

  return formData
}
