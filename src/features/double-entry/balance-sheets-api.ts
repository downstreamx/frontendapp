import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type BalanceSheetItem = {
  id: number
  section_type: string
  sub_section: string
  amount: number | string
  account?: { id: number; account_code: string; account_name: string }
}

export type BalanceSheetNote = {
  id: number
  balance_sheet_id: number
  note_number: number
  note_title: string
  note_content: string
}

export type BalanceSheet = {
  id: number
  balance_sheet_date: string
  financial_year: string
  total_assets: number | string
  total_liabilities: number | string
  total_equity: number | string
  is_balanced: boolean
  status: string
  items?: BalanceSheetItem[]
  notes?: BalanceSheetNote[]
}

export type BalanceSheetSummary = Pick<
  BalanceSheet,
  'id' | 'balance_sheet_date' | 'financial_year' | 'status' | 'is_balanced'
>

export type BalanceSheetComparison = {
  id: number
  comparison_date: string
  current_period: BalanceSheet
  previous_period: BalanceSheet
}

export type ListBalanceSheetsParams = {
  financial_year?: string
  status?: string
  sort?: string
  direction?: string
  page?: number
  per_page?: number
}

export async function fetchBalanceSheetsIndexMeta(): Promise<{ sheets: BalanceSheetSummary[] }> {
  const { data } = await api.get<ApiSuccess<{ sheets: BalanceSheetSummary[] }>>(
    '/double-entry/balance-sheets/index-meta',
  )
  return data.data
}

export async function listBalanceSheetsPaginated(
  params?: ListBalanceSheetsParams,
): Promise<PaginatedListResult<BalanceSheet>> {
  const { data } = await api.get('/double-entry/balance-sheets', { params })
  return extractPaginatedList<BalanceSheet>(data)
}

export async function generateBalanceSheet(input: {
  balance_sheet_date: string
  financial_year: string
}): Promise<BalanceSheet> {
  const { data } = await api.post<ApiSuccess<BalanceSheet>>('/double-entry/balance-sheets', input)
  return data.data
}

export async function getBalanceSheet(id: number): Promise<BalanceSheet> {
  const { data } = await api.get<ApiSuccess<BalanceSheet>>(`/double-entry/balance-sheets/${id}`)
  return data.data
}

export async function deleteBalanceSheet(id: number): Promise<void> {
  await api.delete(`/double-entry/balance-sheets/${id}`)
}

export async function finalizeBalanceSheet(id: number): Promise<BalanceSheet> {
  const { data } = await api.post<ApiSuccess<BalanceSheet>>(
    `/double-entry/balance-sheets/${id}/finalize`,
  )
  return data.data
}

export async function createBalanceSheetNote(
  balanceSheetId: number,
  input: { note_title: string; note_content: string },
): Promise<BalanceSheetNote> {
  const { data } = await api.post<ApiSuccess<BalanceSheetNote>>(
    `/double-entry/balance-sheets/${balanceSheetId}/notes`,
    input,
  )
  return data.data
}

export async function deleteBalanceSheetNote(balanceSheetId: number, noteId: number): Promise<void> {
  await api.delete(`/double-entry/balance-sheets/${balanceSheetId}/notes/${noteId}`)
}

export async function listBalanceSheetComparisons(params?: {
  page?: number
  per_page?: number
}): Promise<PaginatedListResult<BalanceSheetComparison>> {
  const { data } = await api.get('/double-entry/balance-sheet-comparisons', { params })
  return extractPaginatedList<BalanceSheetComparison>(data)
}

export async function createBalanceSheetComparison(input: {
  current_period_id: number
  previous_period_id: number
}): Promise<BalanceSheetComparison> {
  const { data } = await api.post<ApiSuccess<BalanceSheetComparison>>(
    '/double-entry/balance-sheet-comparisons',
    input,
  )
  return data.data
}

export async function getBalanceSheetComparison(id: number): Promise<BalanceSheetComparison> {
  const { data } = await api.get<ApiSuccess<BalanceSheetComparison>>(
    `/double-entry/balance-sheet-comparisons/${id}`,
  )
  return data.data
}

export async function performYearEndClose(input: {
  financial_year: string
  closing_date: string
}): Promise<{ message: string; financial_year: string; closing_date: string }> {
  const { data } = await api.post<
    ApiSuccess<{ message: string; financial_year: string; closing_date: string }>
  >('/double-entry/balance-sheets/year-end-close', input)
  return data.data
}
