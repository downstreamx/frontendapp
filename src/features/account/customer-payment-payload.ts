export type CreateCustomerPaymentPayload = {
  payment_date: string
  customer_id: number
  bank_account_id: number
  reference_number?: string
  payment_amount: number
  notes?: string
  allocations: Array<{ invoice_id: number; amount: number }>
  credit_notes?: Array<{ credit_note_id: number; amount: number }>
  attachment?: File | null
}

export function buildCreateCustomerPaymentFormData(
  body: CreateCustomerPaymentPayload,
): FormData {
  const formData = new FormData()
  formData.append('payment_date', body.payment_date)
  formData.append('customer_id', String(body.customer_id))
  formData.append('bank_account_id', String(body.bank_account_id))
  formData.append('payment_amount', String(body.payment_amount))

  if (body.reference_number) {
    formData.append('reference_number', body.reference_number)
  }
  if (body.notes) {
    formData.append('notes', body.notes)
  }

  body.allocations.forEach((allocation, index) => {
    formData.append(`allocations[${index}][invoice_id]`, String(allocation.invoice_id))
    formData.append(`allocations[${index}][amount]`, String(allocation.amount))
  })

  body.credit_notes?.forEach((creditNote, index) => {
    formData.append(`credit_notes[${index}][credit_note_id]`, String(creditNote.credit_note_id))
    formData.append(`credit_notes[${index}][amount]`, String(creditNote.amount))
  })

  if (body.attachment) {
    formData.append('attachment', body.attachment)
  }

  return formData
}
