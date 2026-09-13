import { api, type ApiSuccess } from '@/lib/api'

export type OtherReportAccount = {
  id: number
  account_code: string
  account_name: string
}

export type GeneralLedgerReport = {
  opening_balance: number
  transactions: Array<{
    id: number
    date: string
    account_code: string
    account_name: string
    description: string | null
    reference_type: string | null
    reference_id: number | null
    debit: number
    credit: number
    balance: number
  }>
  closing_balance: number
  from_date?: string | null
  to_date?: string | null
}

export type JournalEntryReportRow = {
  id: number
  journal_number: string
  date: string
  reference_type: string | null
  description: string | null
  total_debit: number
  total_credit: number
  status: string
  is_balanced: boolean
  items: Array<{
    account_code: string
    account_name: string
    description: string | null
    debit: number
    credit: number
  }>
}

export type JournalEntryReport = {
  entries: JournalEntryReportRow[]
  from_date?: string | null
  to_date?: string | null
  status?: string | null
}

export type AccountBalanceReport = {
  grouped: Record<
    string,
    {
      accounts: Array<{
        account_code: string
        account_name: string
        account_type: string
        debit: number
        credit: number
        net_balance: number
      }>
      subtotal_debit: number
      subtotal_credit: number
      subtotal_net: number
    }
  >
  totals: { debit: number; credit: number; net: number }
  as_of_date?: string
}

export type CashFlowReport = {
  beginning_cash: number
  operating: number
  investing: number
  financing: number
  net_cash_flow: number
  ending_cash: number
  from_date?: string
  to_date?: string
}

export type ExpenseReport = {
  expenses: Array<{ account_code: string; account_name: string; amount: number }>
  total_expenses: number
  from_date?: string
  to_date?: string
}

export type OtherReportKey =
  | 'journal-entry'
  | 'general-ledger'
  | 'account-statement'
  | 'account-balance'
  | 'cash-flow'
  | 'expense-report'

export async function fetchOtherReportsMeta(): Promise<{
  accounts: OtherReportAccount[]
  account_types: string[]
}> {
  const { data } = await api.get<
    ApiSuccess<{ accounts: OtherReportAccount[]; account_types: string[] }>
  >('/double-entry/reports/index-meta')
  return data.data
}

export async function fetchGeneralLedger(params: {
  account_id?: string
  from_date?: string
  to_date?: string
}): Promise<{ report: GeneralLedgerReport; selected_account: OtherReportAccount | null }> {
  const { data } = await api.get<
    ApiSuccess<{ report: GeneralLedgerReport; selected_account: OtherReportAccount | null }>
  >('/double-entry/reports/general-ledger', { params })
  return data.data
}

export async function fetchJournalEntryReport(params: {
  from_date: string
  to_date: string
  status?: string
}): Promise<JournalEntryReport> {
  const { data } = await api.get<ApiSuccess<JournalEntryReport>>(
    '/double-entry/reports/journal-entry',
    { params },
  )
  return data.data
}

export async function fetchAccountBalanceReport(params: {
  as_of_date: string
  account_type?: string
  show_zero_balances?: boolean
}): Promise<AccountBalanceReport> {
  const { data } = await api.get<ApiSuccess<AccountBalanceReport>>(
    '/double-entry/reports/account-balance',
    { params },
  )
  return data.data
}

export async function fetchCashFlowReport(params: {
  from_date: string
  to_date: string
}): Promise<CashFlowReport> {
  const { data } = await api.get<ApiSuccess<CashFlowReport>>('/double-entry/reports/cash-flow', {
    params,
  })
  return data.data
}

export async function fetchExpenseReport(params: {
  from_date: string
  to_date: string
}): Promise<ExpenseReport> {
  const { data } = await api.get<ApiSuccess<ExpenseReport>>(
    '/double-entry/reports/expense-report',
    { params },
  )
  return data.data
}
