import type { BalanceSheetItem } from './balance-sheets-api'

export type GroupedBalanceSheetItems = Record<string, Record<string, BalanceSheetItem[]>>

const SECTION_ORDER = ['assets', 'liabilities', 'equity'] as const

export const SECTION_LABELS: Record<string, string> = {
  assets: 'Assets',
  liabilities: 'Liabilities',
  equity: 'Equity',
}

export function groupBalanceSheetItems(items: BalanceSheetItem[]): GroupedBalanceSheetItems {
  const grouped: GroupedBalanceSheetItems = {}

  for (const item of items) {
    if (!grouped[item.section_type]) {
      grouped[item.section_type] = {}
    }
    if (!grouped[item.section_type][item.sub_section]) {
      grouped[item.section_type][item.sub_section] = []
    }
    grouped[item.section_type][item.sub_section].push(item)
  }

  return grouped
}

export function orderedSectionKeys(grouped: GroupedBalanceSheetItems): string[] {
  const keys = Object.keys(grouped)
  return [
    ...SECTION_ORDER.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !SECTION_ORDER.includes(key as (typeof SECTION_ORDER)[number])),
  ]
}

export function formatSubSectionLabel(subSection: string): string {
  return subSection.replace(/_/g, ' ')
}

export function sectionTotal(items: BalanceSheetItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
}

export function getBalanceSheetStatusBadgeClasses(status: string): string {
  return status === 'finalized'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800'
}

export type ComparisonRow = {
  accountCode: string
  sectionType: string
  name: string
  currentAmount: number
  previousAmount: number
  variance: number
}

export function indexItemsByAccountCode(
  items: BalanceSheetItem[],
): Record<string, BalanceSheetItem> {
  const map: Record<string, BalanceSheetItem> = {}
  for (const item of items) {
    const code = item.account?.account_code
    if (code) {
      map[code] = item
    }
  }
  return map
}

export function buildComparisonRows(
  currentItems: BalanceSheetItem[],
  previousItems: BalanceSheetItem[],
): ComparisonRow[] {
  const currentMap = indexItemsByAccountCode(currentItems)
  const previousMap = indexItemsByAccountCode(previousItems)
  const codes = Array.from(
    new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]),
  ).sort()

  return codes.map((accountCode) => {
    const current = currentMap[accountCode]
    const previous = previousMap[accountCode]
    const currentAmount = Number(current?.amount ?? 0)
    const previousAmount = Number(previous?.amount ?? 0)
    return {
      accountCode,
      sectionType: current?.section_type ?? previous?.section_type ?? '',
      name: current?.account?.account_name ?? previous?.account?.account_name ?? accountCode,
      currentAmount,
      previousAmount,
      variance: currentAmount - previousAmount,
    }
  })
}

export function comparisonRowsForSection(
  rows: ComparisonRow[],
  sectionType: string,
): ComparisonRow[] {
  return rows.filter((row) => row.sectionType === sectionType)
}
