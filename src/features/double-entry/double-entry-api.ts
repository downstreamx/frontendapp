import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'

export type TrialBalanceRow = {
  id?: number
  account_code: string
  account_name: string
  debit: number
  credit: number
}

export type TrialBalanceReport = {
  accounts: TrialBalanceRow[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
  from_date?: string
  to_date?: string
}

export type ProfitLossAccount = {
  id?: number
  account_code: string
  account_name: string
  balance: number
}

export type ProfitLossReport = {
  revenue: ProfitLossAccount[]
  expenses: ProfitLossAccount[]
  total_revenue: number
  total_expenses: number
  net_profit: number
  from_date?: string
  to_date?: string
}

export type LedgerSummaryRow = {
  id?: number
  journal_date: string
  reference_type?: string | null
  account_code: string
  account_name: string
  description?: string | null
  journal_description?: string | null
  debit_amount: string | number
  credit_amount: string | number
}

export type LedgerSummaryAccountOption = {
  id: number
  account_code: string
  account_name: string
}

export type LedgerSummaryExport = {
  rows: LedgerSummaryRow[]
  selected_account: LedgerSummaryAccountOption | null
  filters: { from_date?: string | null; to_date?: string | null }
}

export type {
  BalanceSheet,
  BalanceSheetComparison,
  BalanceSheetItem,
  BalanceSheetNote,
} from './balance-sheets-api'

export type DoubleEntryReportLink = {
  key: string
  path: string
  status?: string
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function listDoubleEntryReports(): Promise<DoubleEntryReportLink[]> {
  const { data } = await api.get<ApiSuccess<{ reports: DoubleEntryReportLink[] }>>(
    '/double-entry/reports',
  )
  return data.data?.reports ?? []
}

export async function fetchTrialBalance(params: {
  from_date: string
  to_date: string
}): Promise<TrialBalanceReport> {
  const { data } = await api.get<ApiSuccess<TrialBalanceReport>>('/double-entry/trial-balance', {
    params,
  })
  return data.data
}

export async function fetchProfitLoss(params: {
  from_date: string
  to_date: string
}): Promise<ProfitLossReport> {
  const { data } = await api.get<ApiSuccess<ProfitLossReport>>('/double-entry/profit-loss', {
    params,
  })
  return data.data
}

export async function fetchLedgerSummaryMeta(): Promise<{
  accounts: LedgerSummaryAccountOption[]
}> {
  const { data } = await api.get<ApiSuccess<{ accounts: LedgerSummaryAccountOption[] }>>(
    '/double-entry/ledger-summary/index-meta',
  )
  return data.data
}

export async function fetchLedgerSummary(params: {
  from_date?: string
  to_date?: string
  account_id?: number | string
  search?: string
  sort?: string
  direction?: string
  page?: number
  per_page?: number
}): Promise<{ rows: LedgerSummaryRow[]; page: number; lastPage: number }> {
  const { data } = await api.get<ApiSuccess<unknown>>('/double-entry/ledger-summary', { params })
  const body = unwrapData<Record<string, unknown>>(data)
  const rows = extractListRows<LedgerSummaryRow>(body)
  return {
    rows,
    page: Number(body.current_page ?? 1),
    lastPage: Number(body.last_page ?? 1),
  }
}

export async function fetchLedgerSummaryExport(params: {
  from_date?: string
  to_date?: string
  account_id?: number | string
  search?: string
  sort?: string
  direction?: string
}): Promise<LedgerSummaryExport> {
  const { data } = await api.get<ApiSuccess<LedgerSummaryExport>>('/double-entry/ledger-summary', {
    params: { ...params, export: 1 },
  })
  return data.data
}

export {
  generateBalanceSheet,
  getBalanceSheet,
  listBalanceSheetsPaginated,
  listBalanceSheetsPaginated as listBalanceSheets,
} from './balance-sheets-api'
