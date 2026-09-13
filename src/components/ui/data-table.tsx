import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from './card'
import { Input } from './input'
import { Button } from './button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useListPaginationMeta } from '@/contexts/list-pagination-context'
import { serialNumberColumn } from '@/lib/table-columns'

/** Tabular lists: use DataTable (`showSerialColumn` defaults true). Card/grid indexes (plans, POS, modules) omit S/N by design. */

export interface Column<T = any> {
  key: string
  header: string
  sortable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  className?: string
}

function formatCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return value as React.ReactNode
}

export interface DataTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  onSort?: (key: string) => void
  sortKey?: string
  /** Legacy alias for `sortKey` (Inertia-era list pages). */
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  emptyState?: React.ReactNode
  className?: string
  /** Table only — use inside ModuleListCard (no outer Card). */
  embedded?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  showPagination?: boolean
  rowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  /** Prepend S/N column (default true). Set false for nested or duplicate serial columns. */
  showSerialColumn?: boolean
  /** Override S/N start index; otherwise uses list pagination context or client page offset. */
  serialPageOffset?: number
}

function PaginationFooter({
  currentPage,
  pageSize,
  total,
  onPageChange,
}: {
  currentPage: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total}{' '}
        results
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1),
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              </React.Fragment>
            ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function DataTable<T = any>({
  data,
  columns,
  onSort,
  sortKey,
  sortField,
  sortDirection,
  emptyState,
  className,
  embedded = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  showPagination = false,
  rowProps,
  showSerialColumn = true,
  serialPageOffset,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const listPagination = useListPaginationMeta()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const activeSortKey = sortKey ?? sortField

  const getSortIcon = (field: string) => {
    if (activeSortKey !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) onSort(key)
  }

  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : []
    if (!searchable || !searchTerm) return safeData
    return safeData.filter((row: any) =>
      columns.some((column) => {
        const value = row[column.key]
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      }),
    )
  }, [data, searchTerm, columns, searchable])

  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize, showPagination])

  const handlePageChange = (page: number) => setCurrentPage(page)

  const resolvedSerialOffset =
    serialPageOffset ??
    (listPagination?.from ? Math.max(0, listPagination.from - 1) : showPagination ? (currentPage - 1) * pageSize : 0)

  const tableColumns = useMemo(() => {
    if (!showSerialColumn || columns.some((c) => c.key === 'sn')) {
      return columns
    }
    const sn = serialNumberColumn<T>(resolvedSerialOffset)
    sn.header = t('S/N')
    return [sn, ...columns]
  }, [columns, showSerialColumn, resolvedSerialOffset, t])

  const table = (
    <Table>
      <TableHeader className="[&_tr]:border-primary/10 [&_tr]:bg-transparent">
        <TableRow>
          {tableColumns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                'bg-primary font-semibold text-primary-foreground',
                column.sortable ? 'cursor-pointer' : '',
                column.className || '',
              )}
              onClick={() => handleSort(column.key, column.sortable)}
            >
              <div className="flex items-center gap-2">
                {column.header}
                {column.sortable && getSortIcon(column.key)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.length > 0 ? (
          paginatedData.map((row, index) => (
            <TableRow key={(row as any).id || index} {...(rowProps ? rowProps(row, index) : {})}>
              {tableColumns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render
                    ? column.render((row as any)[column.key], row, index)
                    : formatCellValue((row as any)[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={tableColumns.length} className="h-24 text-center">
              {emptyState || (
                <p className="text-muted-foreground">
                  {searchTerm ? 'No results found' : 'No data available'}
                </p>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  const pagination =
    showPagination && filteredData.length > pageSize ? (
      <PaginationFooter
        currentPage={currentPage}
        pageSize={pageSize}
        total={filteredData.length}
        onPageChange={handlePageChange}
      />
    ) : null

  if (embedded) {
    return (
      <div className={cn('w-full', className)}>
        {table}
        {pagination}
      </div>
    )
  }

  return (
    <Card className={className}>
      {searchable && (
        <CardHeader className="pb-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">{table}</CardContent>
      {pagination}
    </Card>
  )
}
