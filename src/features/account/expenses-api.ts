import { api, type ApiSuccess } from '@/lib/api'
import { buildExpenseFormData } from './expense-payload'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type ExpenseCategoryOption = {
  id: number
  category_name: string
  category_code?: string
}

export type ExpenseBankAccountOption = {
  id: number
  account_name: string
  account_number?: string
}

export type ExpenseChartOfAccountOption = {
  id: number
  account_code: string
  account_name: string
}

export type Expense = {
  id: number
  expense_number?: string
  expense_date: string
  category_id?: number
  bank_account_id?: number
  chart_of_account_id?: number | null
  amount: number | string
  status: string
  description?: string | null
  reference_number?: string | null
  attachment?: string | null
  approved_by?: number | null
  category?: ExpenseCategoryOption
  bank_account?: ExpenseBankAccountOption
  chart_of_account?: ExpenseChartOfAccountOption
  approved_by_user?: { id: number; name: string }
}

export type ExpenseInput = {
  expense_date: string
  category_id: number
  bank_account_id: number
  chart_of_account_id?: number | null
  amount: number
  description?: string
  reference_number?: string
}

export type ExpensePayload = ExpenseInput & {
  attachment?: File | null
}

export type ExpenseIndexMeta = {
  categories: ExpenseCategoryOption[]
  bank_accounts: ExpenseBankAccountOption[]
  chart_of_accounts: ExpenseChartOfAccountOption[]
}

const base = '/account/expenses'

export async function listExpensesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<Expense>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<Expense>(data)
}

export async function listExpenses(params?: Record<string, string>) {
  const result = await listExpensesPaginated({ per_page: '100', ...params })
  return result.rows
}

export async function getExpenseIndexMeta(): Promise<ExpenseIndexMeta> {
  const { data } = await api.get<ApiSuccess<ExpenseIndexMeta>>(`${base}/index-meta`)
  return data.data
}

export async function getExpenseCreateMeta(): Promise<ExpenseIndexMeta> {
  const { data } = await api.get<ApiSuccess<ExpenseIndexMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getExpense(id: number): Promise<Expense> {
  const { data } = await api.get<ApiSuccess<Expense>>(`${base}/${id}`)
  return data.data
}

export async function createExpense(input: ExpensePayload): Promise<Expense> {
  const body = input.attachment ? buildExpenseFormData(input) : input
  const { data } = await api.post<ApiSuccess<Expense>>(base, body)
  return data.data
}

export async function updateExpense(id: number, input: ExpensePayload): Promise<Expense> {
  const body = input.attachment ? buildExpenseFormData(input) : input
  const { data } = await api.put<ApiSuccess<Expense>>(`${base}/${id}`, body)
  return data.data
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}

export async function approveExpense(id: number): Promise<Expense> {
  const { data } = await api.post<ApiSuccess<Expense>>(`${base}/${id}/approve`)
  return data.data
}

export async function postExpense(id: number): Promise<Expense> {
  const { data } = await api.post<ApiSuccess<Expense>>(`${base}/${id}/post`)
  return data.data
}
