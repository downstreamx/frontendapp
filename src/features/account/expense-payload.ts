import type { ExpenseInput } from './expenses-api'

export type CreateExpensePayload = ExpenseInput & {
  attachment?: File | null
}

export function buildExpenseFormData(body: CreateExpensePayload): FormData {
  const formData = new FormData()
  formData.append('expense_date', body.expense_date)
  formData.append('category_id', String(body.category_id))
  formData.append('bank_account_id', String(body.bank_account_id))
  formData.append('amount', String(body.amount))

  if (body.chart_of_account_id != null) {
    formData.append('chart_of_account_id', String(body.chart_of_account_id))
  }
  if (body.description) {
    formData.append('description', body.description)
  }
  if (body.reference_number) {
    formData.append('reference_number', body.reference_number)
  }
  if (body.attachment) {
    formData.append('attachment', body.attachment)
  }

  return formData
}
