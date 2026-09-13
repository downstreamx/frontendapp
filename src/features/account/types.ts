export type CustomerOption = { id: number; name: string; email?: string }
export type BankAccountOption = { id: number; account_name: string; account_number?: string }

export type SalesInvoiceOutstanding = {
  id: number
  invoice_number?: string
  invoice_date?: string
  balance_amount: number
  total_amount?: number
}

export type CreditNoteOutstanding = {
  id: number
  credit_note_number?: string
  balance_amount: number
  total_amount?: number
  status?: string
}

export type AllocationInput = { invoice_id: number; amount: number }
export type CreditNoteInput = { credit_note_id: number; amount: number }
export type DebitNoteInput = { debit_note_id: number; amount: number }

export type DebitNoteOutstanding = {
  id: number
  debit_note_number?: string
  balance_amount: number
  total_amount?: number
  status?: string
}

export type SupplierPaymentFormValues = {
  payment_date: string
  supplier_id: string
  bank_account_id: string
  reference_number: string
  payment_amount: string
  notes: string
  allocations: AllocationInput[]
  debit_notes: DebitNoteInput[]
}

export type CustomerPaymentFormValues = {
  payment_date: string
  customer_id: string
  bank_account_id: string
  reference_number: string
  payment_amount: string
  notes: string
  allocations: AllocationInput[]
  credit_notes: CreditNoteInput[]
}

export type CustomerPayment = {
  id: number
  payment_number?: string
  payment_date: string
  payment_amount: number | string
  reference_number?: string
  status: string
  notes?: string
  created_at?: string
  customer?: { id: number; name: string; email?: string }
  bank_account?: { id: number; account_name: string; account_number?: string }
  allocations?: Array<{
    id: number
    allocated_amount: number | string
    invoice?: {
      id: number
      invoice_number?: string
      invoice_date?: string
      total_amount?: number | string
    }
  }>
  attachment?: string | null
  credit_note_applications?: Array<{
    id: number
    applied_amount: number | string
    application_date?: string
    credit_note?: { id: number; credit_note_number?: string }
  }>
  creditNoteApplications?: CustomerPayment['credit_note_applications']
}
