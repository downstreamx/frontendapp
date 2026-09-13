import type { NavItem } from '@/types'
import { isMenuBranchActive, isMenuPathActive } from '@/utils/menu-path'

const ROWS_PER_COLUMN = 7
const MAX_COLUMNS = 6

function chunkItems(items: NavItem[], maxColumns = MAX_COLUMNS): NavItem[][] {
  if (items.length === 0) {
    return []
  }

  const columnCount = Math.min(maxColumns, Math.max(1, Math.ceil(items.length / ROWS_PER_COLUMN)))
  const perColumn = Math.ceil(items.length / columnCount)
  const columns: NavItem[][] = []

  for (let i = 0; i < items.length; i += perColumn) {
    columns.push(items.slice(i, i + perColumn))
  }

  return columns
}

export function layoutMegaMenuColumns(children: NavItem[]): NavItem[][] {
  if (children.length === 0) {
    return []
  }

  const nestedColumns: NavItem[][] = []
  const flatItems: NavItem[] = []

  for (const child of children) {
    if (child.children && child.children.length > 0) {
      nestedColumns.push(...chunkItems(child.children, 2))
    } else {
      flatItems.push(child)
    }
  }

  const columns = [...nestedColumns, ...chunkItems(flatItems)]

  if (columns.length <= MAX_COLUMNS) {
    return columns
  }

  return chunkItems(columns.flat(), MAX_COLUMNS)
}

const FULL_WIDTH_COLUMN_THRESHOLD = 4
const FULL_WIDTH_ITEM_THRESHOLD = 14

export function shouldUseFullWidthMegaMenuDropdown(item: NavItem): boolean {
  const columns = layoutMegaMenuColumns(item.children ?? [])
  const totalItems = columns.reduce((count, column) => count + column.length, 0)

  return columns.length >= FULL_WIDTH_COLUMN_THRESHOLD || totalItems >= FULL_WIDTH_ITEM_THRESHOLD
}

export function getNavItemActiveState(pathname: string, item: NavItem): boolean {
  const isActive = isMenuPathActive(pathname, item.href)
  const hasActiveChild = item.children ? isMenuBranchActive(pathname, item.children) : false
  return isActive || hasActiveChild
}
