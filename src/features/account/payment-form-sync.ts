import type { UseFormSetValue } from 'react-hook-form'
import type {
  AllocationInput,
  CreditNoteInput,
  CustomerPaymentFormValues,
  DebitNoteInput,
  SupplierPaymentFormValues,
} from './types'

function toMoney(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function normalizeAllocations(rows: AllocationInput[]): AllocationInput[] {
  return rows.map((row) => ({
    invoice_id: Number(row.invoice_id),
    amount: toMoney(row.amount),
  }))
}

export function normalizeDebitNotes(rows: DebitNoteInput[]): DebitNoteInput[] {
  return rows.map((row) => ({
    debit_note_id: Number(row.debit_note_id),
    amount: toMoney(row.amount),
  }))
}

export function normalizeCreditNotes(rows: CreditNoteInput[]): CreditNoteInput[] {
  return rows.map((row) => ({
    credit_note_id: Number(row.credit_note_id),
    amount: toMoney(row.amount),
  }))
}

export function netPaymentAmount(
  allocations: AllocationInput[],
  noteAmounts: number[],
): number {
  const allocated = allocations.reduce((sum, row) => sum + toMoney(row.amount), 0)
  const notes = noteAmounts.reduce((sum, amount) => sum + toMoney(amount), 0)
  return Math.max(0, allocated - notes)
}

export function syncSupplierPaymentForm(
  setValue: UseFormSetValue<SupplierPaymentFormValues>,
  allocations: AllocationInput[],
  debitNotes: DebitNoteInput[],
): void {
  const normalizedAllocations = normalizeAllocations(allocations)
  const normalizedDebits = normalizeDebitNotes(debitNotes)
  const total = netPaymentAmount(
    normalizedAllocations,
    normalizedDebits.map((row) => row.amount),
  )

  setValue('allocations', normalizedAllocations, { shouldValidate: false })
  setValue('debit_notes', normalizedDebits, { shouldValidate: false })
  setValue('payment_amount', total.toFixed(2), { shouldValidate: false })
}

export function syncCustomerPaymentForm(
  setValue: UseFormSetValue<CustomerPaymentFormValues>,
  allocations: AllocationInput[],
  creditNotes: CreditNoteInput[],
): void {
  const normalizedAllocations = normalizeAllocations(allocations)
  const normalizedCredits = normalizeCreditNotes(creditNotes)
  const total = netPaymentAmount(
    normalizedAllocations,
    normalizedCredits.map((row) => row.amount),
  )

  setValue('allocations', normalizedAllocations, { shouldValidate: false })
  setValue('credit_notes', normalizedCredits, { shouldValidate: false })
  setValue('payment_amount', total.toFixed(2), { shouldValidate: false })
}
