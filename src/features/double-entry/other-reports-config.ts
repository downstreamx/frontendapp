import type { OtherReportKey } from './other-reports-api'

export type OtherReportDefinition = {
  key: OtherReportKey
  titleKey: string
  viewPermission: string
  printPermission: string
  needsAccount: boolean
  usesAsOfDate: boolean
}

export const OTHER_REPORTS: OtherReportDefinition[] = [
  {
    key: 'journal-entry',
    titleKey: 'Journal entry',
    viewPermission: 'view-journal-entry',
    printPermission: 'print-journal-entry',
    needsAccount: false,
    usesAsOfDate: false,
  },
  {
    key: 'general-ledger',
    titleKey: 'General ledger',
    viewPermission: 'view-general-ledger',
    printPermission: 'print-general-ledger',
    needsAccount: true,
    usesAsOfDate: false,
  },
  {
    key: 'account-statement',
    titleKey: 'Account statement',
    viewPermission: 'view-account-statement',
    printPermission: 'print-account-statement',
    needsAccount: true,
    usesAsOfDate: false,
  },
  {
    key: 'account-balance',
    titleKey: 'Account balance',
    viewPermission: 'view-account-balance',
    printPermission: 'print-account-balance',
    needsAccount: false,
    usesAsOfDate: true,
  },
  {
    key: 'cash-flow',
    titleKey: 'Cash flow',
    viewPermission: 'view-cash-flow',
    printPermission: 'print-cash-flow',
    needsAccount: false,
    usesAsOfDate: false,
  },
  {
    key: 'expense-report',
    titleKey: 'Expense report',
    viewPermission: 'view-expense-report',
    printPermission: 'print-expense-report',
    needsAccount: false,
    usesAsOfDate: false,
  },
]

export function getOtherReportDefinition(key: string): OtherReportDefinition | undefined {
  return OTHER_REPORTS.find((r) => r.key === key)
}

export function isOtherReportKey(key: string): key is OtherReportKey {
  return OTHER_REPORTS.some((r) => r.key === key)
}
