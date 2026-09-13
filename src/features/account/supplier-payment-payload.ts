export type CreateSupplierPaymentPayload = {
  payment_date: string
  supplier_id: number
  bank_account_id: number
  reference_number?: string
  payment_amount: number
  notes?: string
  allocations: Array<{ invoice_id: number; amount: number }>
  debit_notes?: Array<{ debit_note_id: number; amount: number }>
  attachment?: File | null
}

export function buildCreateSupplierPaymentFormData(
  body: CreateSupplierPaymentPayload,
): FormData {
  const formData = new FormData()
  formData.append('payment_date', body.payment_date)
  formData.append('supplier_id', String(body.supplier_id))
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

  body.debit_notes?.forEach((debitNote, index) => {
    formData.append(`debit_notes[${index}][debit_note_id]`, String(debitNote.debit_note_id))
    formData.append(`debit_notes[${index}][amount]`, String(debitNote.amount))
  })

  if (body.attachment) {
    formData.append('attachment', body.attachment)
  }

  return formData
}
