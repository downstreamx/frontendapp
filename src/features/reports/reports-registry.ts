import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Landmark,
  Package,
  PieChart,
  Receipt,
  Scale,
  Truck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { paths } from '@/lib/paths'

export type ReportCategory = 'financial' | 'account' | 'operational' | 'other'

export type ReportStatus = 'available' | 'coming_soon'

export type ReportDefinition = {
  key: string
  titleKey: string
  descriptionKey: string
  href: string
  permission: string
  category: ReportCategory
  status: ReportStatus
  icon: LucideIcon
}

export const REPORT_CATEGORY_ORDER: ReportCategory[] = [
  'financial',
  'account',
  'operational',
  'other',
]

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  financial: 'Financial statements',
  account: 'Account reports',
  operational: 'Operational reports',
  other: 'Other reports',
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: 'ledger-summary',
    titleKey: 'Ledger summary',
    descriptionKey: 'Account-level debits and credits for a date range.',
    href: paths.doubleEntry.ledgerSummary,
    permission: 'manage-ledger-summary',
    category: 'financial',
    status: 'available',
    icon: BookOpen,
  },
  {
    key: 'trial-balance',
    titleKey: 'Trial balance',
    descriptionKey: 'Debit and credit totals by account with balance check.',
    href: paths.doubleEntry.trialBalance,
    permission: 'manage-trial-balance',
    category: 'financial',
    status: 'available',
    icon: Scale,
  },
  {
    key: 'profit-loss',
    titleKey: 'Profit & loss',
    descriptionKey: 'Revenue, expenses, and net profit for a period.',
    href: paths.doubleEntry.profitLoss,
    permission: 'manage-profit-loss',
    category: 'financial',
    status: 'available',
    icon: TrendingUp,
  },
  {
    key: 'balance-sheets',
    titleKey: 'Balance sheet',
    descriptionKey: 'Assets, liabilities, and equity snapshots.',
    href: paths.doubleEntry.balanceSheets,
    permission: 'manage-balance-sheets',
    category: 'financial',
    status: 'available',
    icon: Landmark,
  },
  {
    key: 'invoice-aging',
    titleKey: 'Invoice aging',
    descriptionKey: 'Outstanding customer invoices by aging bucket.',
    href: '/account/reports/invoice-aging',
    permission: 'view-invoice-aging',
    category: 'account',
    status: 'available',
    icon: FileSpreadsheet,
  },
  {
    key: 'bill-aging',
    titleKey: 'Bill aging',
    descriptionKey: 'Outstanding supplier bills by aging bucket.',
    href: '/account/reports/bill-aging',
    permission: 'view-bill-aging',
    category: 'account',
    status: 'available',
    icon: Receipt,
  },
  {
    key: 'tax-summary',
    titleKey: 'Tax summary',
    descriptionKey: 'Tax collected and paid across transactions.',
    href: '/account/reports/tax-summary',
    permission: 'view-tax-summary',
    category: 'account',
    status: 'available',
    icon: PieChart,
  },
  {
    key: 'customer-balance',
    titleKey: 'Customer balance',
    descriptionKey: 'Customer AR balances and credit summary.',
    href: paths.account.creditBalance,
    permission: 'view-customer-balance',
    category: 'account',
    status: 'available',
    icon: Users,
  },
  {
    key: 'supplier-balance',
    titleKey: 'Supplier balance',
    descriptionKey: 'Supplier AP balances as of a date.',
    href: '/account/reports/supplier-balance',
    permission: 'view-supplier-balance',
    category: 'account',
    status: 'available',
    icon: Wallet,
  },
  {
    key: 'purchase-bridging',
    titleKey: 'Purchase bridging',
    descriptionKey: 'Purchase invoices and supplier truck loads.',
    href: paths.reports.operational('purchase-bridging'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Truck,
  },
  {
    key: 'sales-distribution',
    titleKey: 'Sales distribution',
    descriptionKey: 'Sales invoices and assigned truck loads.',
    href: paths.reports.operational('sales-distribution'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Truck,
  },
  {
    key: 'bridging',
    titleKey: 'Sales distribution',
    descriptionKey: 'Sales invoice loads and distribution activity.',
    href: paths.reports.operational('sales-distribution'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Truck,
  },
  {
    key: 'stock-balances',
    titleKey: 'Stock Balances',
    descriptionKey: 'Customer entitlements and depot stock on hand.',
    href: paths.reports.operational('stock-balances'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Package,
  },
  {
    key: 'goods-in-transit',
    titleKey: 'Goods in Transit',
    descriptionKey: 'Open transits, loading schedules, and deliveries.',
    href: paths.reports.operational('goods-in-transit'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Truck,
  },
  {
    key: 'trucks-out-today',
    titleKey: 'Trucks Out Today',
    descriptionKey: 'Bridging and loading activity for today.',
    href: paths.reports.operational('trucks-out-today'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Truck,
  },
  {
    key: 'bank-balances-eod',
    titleKey: 'Bank Balances EOD',
    descriptionKey: 'End-of-day balances across bank accounts.',
    href: paths.reports.operational('bank-balances-eod'),
    permission: 'manage-dashboard',
    category: 'operational',
    status: 'available',
    icon: Landmark,
  },
  {
    key: 'journal-entry',
    titleKey: 'Journal entry',
    descriptionKey: 'Posted journal lines for the selected period.',
    href: '/double-entry/reports/journal-entry',
    permission: 'view-journal-entry',
    category: 'other',
    status: 'available',
    icon: FileText,
  },
  {
    key: 'general-ledger',
    titleKey: 'General ledger',
    descriptionKey: 'Detailed ledger activity by account.',
    href: '/double-entry/reports/general-ledger',
    permission: 'view-general-ledger',
    category: 'other',
    status: 'available',
    icon: BookOpen,
  },
  {
    key: 'account-statement',
    titleKey: 'Account statement',
    descriptionKey: 'Running balance for a single GL account.',
    href: '/double-entry/reports/account-statement',
    permission: 'view-account-statement',
    category: 'other',
    status: 'available',
    icon: FileText,
  },
  {
    key: 'account-balance',
    titleKey: 'Account balance',
    descriptionKey: 'Balances across chart of accounts.',
    href: '/double-entry/reports/account-balance',
    permission: 'view-account-balance',
    category: 'other',
    status: 'available',
    icon: Scale,
  },
  {
    key: 'cash-flow',
    titleKey: 'Cash flow',
    descriptionKey: 'Cash inflows and outflows for a period.',
    href: '/double-entry/reports/cash-flow',
    permission: 'view-cash-flow',
    category: 'other',
    status: 'available',
    icon: ArrowLeftRight,
  },
  {
    key: 'expense-report',
    titleKey: 'Expense report',
    descriptionKey: 'Expense totals grouped by category.',
    href: '/double-entry/reports/expense-report',
    permission: 'view-expense-report',
    category: 'other',
    status: 'available',
    icon: Receipt,
  },
]

export function mergeReportStatus(
  definitions: ReportDefinition[],
  apiReports: Array<{ key: string; status?: string }>,
): ReportDefinition[] {
  const statusByKey = new Map(
    apiReports.map((r) => [r.key, r.status === 'coming_soon' ? 'coming_soon' : 'available'] as const),
  )

  return definitions.map((def) => ({
    ...def,
    status: statusByKey.get(def.key) ?? def.status,
  }))
}
