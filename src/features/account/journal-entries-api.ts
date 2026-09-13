import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type JournalEntry = {
  id: number
  journal_number?: string
  journal_date: string
  description: string
  status: string
  entry_type?: string
  reference_type?: string
  reference_id?: number | null
  total_debit?: number | string
  total_credit?: number | string
}

export type JournalEntryItem = {
  id: number
  account_id: number
  description?: string | null
  debit_amount?: number | string
  credit_amount?: number | string
  account?: { id: number; account_code: string; account_name: string }
}

export type JournalEntryDetail = JournalEntry & {
  items: JournalEntryItem[]
}

export type JournalAccountOption = {
  id: number
  account_code: string
  account_name: string
  normal_balance: string
}

export type JournalEntryLineInput = {
  account_id: number
  debit?: number
  credit?: number
  description?: string
}

export type JournalEntryInput = {
  journal_date: string
  description: string
  entry_type?: string
  items: JournalEntryLineInput[]
}

export type JournalEntryIndexMeta = {
  accounts: JournalAccountOption[]
}

const base = '/account/journal-entries'

export async function listJournalEntriesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<JournalEntry>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<JournalEntry>(data)
}

export async function listJournalEntries(params?: Record<string, string>) {
  const result = await listJournalEntriesPaginated({ per_page: '100', ...params })
  return result.rows
}

export async function getJournalEntryIndexMeta(): Promise<JournalEntryIndexMeta> {
  const { data } = await api.get<ApiSuccess<JournalEntryIndexMeta>>(`${base}/index-meta`)
  return data.data
}

export async function getJournalEntryCreateMeta(): Promise<JournalEntryIndexMeta> {
  const { data } = await api.get<ApiSuccess<JournalEntryIndexMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getJournalEntry(id: number): Promise<JournalEntryDetail> {
  const { data } = await api.get<ApiSuccess<JournalEntryDetail>>(`${base}/${id}`)
  return data.data
}

export async function createJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
  const { data } = await api.post<ApiSuccess<JournalEntry>>(base, input)
  return data.data
}

export async function postJournalEntry(id: number): Promise<JournalEntry> {
  const { data } = await api.post<ApiSuccess<JournalEntry>>(`${base}/${id}/post`)
  return data.data
}

export async function unpostJournalEntry(id: number): Promise<JournalEntry> {
  const { data } = await api.post<ApiSuccess<JournalEntry>>(`${base}/${id}/unpost`)
  return data.data
}
