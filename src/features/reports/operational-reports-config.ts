import { paths } from '@/lib/paths'

export const OPERATIONAL_REPORT_KEYS = [
  'purchase-bridging',
  'sales-distribution',
  'bridging',
  'stock-balances',
  'goods-in-transit',
  'trucks-out-today',
  'bank-balances-eod',
] as const

export type OperationalReportKey = (typeof OPERATIONAL_REPORT_KEYS)[number]

export function isOperationalReportKey(key: string | undefined): key is OperationalReportKey {
  return OPERATIONAL_REPORT_KEYS.includes(key as OperationalReportKey)
}

export const OPERATIONAL_REPORT_META: Record<
  OperationalReportKey,
  { titleKey: string; descriptionKey: string; hasDateRange?: boolean; hasAsOfDate?: boolean; hasReportDate?: boolean }
> = {
  'purchase-bridging': {
    titleKey: 'Purchase bridging',
    descriptionKey: 'Purchase invoices and supplier truck loads.',
    hasDateRange: true,
  },
  'sales-distribution': {
    titleKey: 'Sales distribution',
    descriptionKey: 'Sales invoices and assigned truck loads.',
    hasDateRange: true,
  },
  bridging: {
    titleKey: 'Sales distribution',
    descriptionKey: 'Alias for sales distribution report.',
    hasDateRange: true,
  },
  'stock-balances': {
    titleKey: 'Stock Balances',
    descriptionKey: 'Customer entitlements and depot stock on hand.',
  },
  'goods-in-transit': {
    titleKey: 'Goods in Transit',
    descriptionKey: 'Open transits, loading schedules, and deliveries.',
  },
  'trucks-out-today': {
    titleKey: 'Trucks Out Today',
    descriptionKey: 'Bridging and loading activity for the selected date.',
    hasReportDate: true,
  },
  'bank-balances-eod': {
    titleKey: 'Bank Balances EOD',
    descriptionKey: 'End-of-day balances across bank accounts.',
    hasAsOfDate: true,
  },
}

export function operationalReportPath(key: OperationalReportKey): string {
  return paths.reports.operational(key)
}
