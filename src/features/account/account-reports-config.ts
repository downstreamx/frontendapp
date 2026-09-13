import type { AccountReportKey } from './account-reports-api'

export type AccountReportDefinition = {
  key: AccountReportKey
  titleKey: string
  viewPermission: string
  printPermission: string
  usesDateRange: boolean
}

export const ACCOUNT_REPORTS: AccountReportDefinition[] = [
  {
    key: 'invoice-aging',
    titleKey: 'Invoice aging',
    viewPermission: 'view-invoice-aging',
    printPermission: 'print-invoice-aging',
    usesDateRange: false,
  },
  {
    key: 'bill-aging',
    titleKey: 'Bill aging',
    viewPermission: 'view-bill-aging',
    printPermission: 'print-bill-aging',
    usesDateRange: false,
  },
  {
    key: 'tax-summary',
    titleKey: 'Tax summary',
    viewPermission: 'view-tax-summary',
    printPermission: 'print-tax-summary',
    usesDateRange: true,
  },
  {
    key: 'supplier-balance',
    titleKey: 'Supplier balance',
    viewPermission: 'view-supplier-balance',
    printPermission: 'print-supplier-balance',
    usesDateRange: false,
  },
]

export function getAccountReportDefinition(key: string): AccountReportDefinition | undefined {
  return ACCOUNT_REPORTS.find((r) => r.key === key)
}

export function isAccountReportKey(key: string): key is AccountReportKey {
  return ACCOUNT_REPORTS.some((r) => r.key === key)
}

export const AGING_BUCKET_LABELS: Record<string, string> = {
  current: 'Current',
  '1_30_days': '1–30 days',
  '31_60_days': '31–60 days',
  '61_90_days': '61–90 days',
  over_90_days: 'Over 90 days',
}
