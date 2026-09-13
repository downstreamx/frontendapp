import { z } from 'zod'

const money = z.coerce.number()

const allocationLine = z.object({
  invoice_id: z.coerce.number(),
  amount: money.min(0.01, 'Allocation amount must be greater than zero'),
})

const creditNoteLine = z.object({
  credit_note_id: z.coerce.number(),
  amount: money.min(0.01, 'Credit note amount must be greater than zero'),
})

const debitNoteLine = z.object({
  debit_note_id: z.coerce.number(),
  amount: money.min(0.01, 'Debit note amount must be greater than zero'),
})

const paymentBase = {
  payment_date: z.string().min(1, 'Payment date is required'),
  bank_account_id: z.string().min(1, 'Bank account is required'),
  reference_number: z.string().optional(),
  /** Matches API (`min:0`); net amount is derived from allocations minus notes. */
  payment_amount: money.min(0, 'Payment amount cannot be negative'),
  notes: z.string().optional(),
  allocations: z
    .array(allocationLine)
    .min(1, 'Add at least one outstanding invoice to the payment'),
}

export const customerPaymentSchema = z
  .object({
    ...paymentBase,
    customer_id: z.string().min(1, 'Customer is required'),
    credit_notes: z.array(creditNoteLine).optional(),
  })
  .superRefine((data, ctx) => {
    const allocated = data.allocations.reduce((sum, row) => sum + row.amount, 0)
    const credits = (data.credit_notes ?? []).reduce((sum, row) => sum + row.amount, 0)
    if (allocated - credits < 0.01) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Payment amount must be greater than zero (reduce credit note applications or add more invoice allocation)',
        path: ['payment_amount'],
      })
    }
  })

export const supplierPaymentSchema = z
  .object({
    ...paymentBase,
    supplier_id: z.string().min(1, 'Supplier is required'),
    debit_notes: z.array(debitNoteLine).optional(),
  })
  .superRefine((data, ctx) => {
    const allocated = data.allocations.reduce((sum, row) => sum + row.amount, 0)
    const debits = (data.debit_notes ?? []).reduce((sum, row) => sum + row.amount, 0)
    if (allocated - debits < 0.01) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Payment amount must be greater than zero (reduce debit note applications or add more invoice allocation)',
        path: ['payment_amount'],
      })
    }
  })
