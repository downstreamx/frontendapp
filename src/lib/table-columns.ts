import type { Column } from '@/components/ui/data-table'
import type { PaginatedListMeta } from '@/components/ui/pagination'

/** Zero-based row index offset for paginated list S/N (use `from - 1` from Laravel meta). */
export function serialOffsetFromPagination(meta?: PaginatedListMeta | null): number {
  if (!meta?.from) return 0
  return Math.max(0, meta.from - 1)
}

export function serialNumberColumn<T>(pageOffset = 0): Column<T> {
  return {
    key: 'sn',
    header: 'S/N',
    className: 'w-14 text-center tabular-nums',
    render: (_value, _row, index) => pageOffset + index + 1,
  }
}
