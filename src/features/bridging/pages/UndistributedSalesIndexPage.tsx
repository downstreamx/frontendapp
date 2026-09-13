import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useSalesPageChrome } from '@/features/sales/hooks/use-sales-page-chrome'
import { listUndistributedSales, type UndistributedSalesRow } from '../bridging-api'
import {
  salesDistributionStatusBadgeClass,
  salesDistributionStatusLabel,
} from '../bridging-status-ui'

function resolveDistributionStatus(row: UndistributedSalesRow): string {
  return row.distribution_status ?? 'undistributed'
}

export function UndistributedSalesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const page = searchParams.get('page') ?? '1'

  useSalesPageChrome(t('Undistributed Sales'), t('Undistributed Sales'))

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    return params
  }, [page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.sales.undistributed(listParams),
    queryFn: () => listUndistributedSales(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<UndistributedSalesRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice Number'),
      render: (value, row) => (
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => navigate(`${paths.sales.invoices}/${row.id}`)}
        >
          {String(value)}
        </button>
      ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.company_name || row.customer?.name || '—',
    },
    {
      key: 'invoice_date',
      header: t('Invoice Date'),
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name ?? '—',
    },
    {
      key: 'distributed_qty',
      header: t('Distributed Qty'),
      render: (_, row) => formatQuantity(row.distributed_qty ?? row.total_distributed_qty ?? 0),
    },
    {
      key: 'undistributed_qty',
      header: t('Undistributed Qty'),
      render: (_, row) => (
        <span className="font-medium text-amber-700 dark:text-amber-400">
          {formatQuantity(row.undistributed_qty ?? 0)}
        </span>
      ),
    },
    {
      key: 'distribution_status',
      header: t('Distribution'),
      render: (_, row) => {
        const status = resolveDistributionStatus(row)
        return (
          <span className={salesDistributionStatusBadgeClass(status)}>
            {salesDistributionStatusLabel(status, t)}
          </span>
        )
      },
    },
    {
      key: 'total_amount',
      header: t('Total'),
      render: (value) => formatCurrency(Number(value)),
    },
  ]

  return (
    <ModuleListCard
      title={t('Undistributed sales')}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: (cleared) => toolbar.applySearch(cleared),
        searchPlaceholder: t('Search invoices...'),
        controls: (
          <PerPageSelector
            value={toolbar.perPage}
            onChange={(value) => {
              toolbar.setPerPage(value)
              const next = new URLSearchParams(searchParams)
              next.set('per_page', value)
              next.set('page', '1')
              setSearchParams(next)
            }}
          />
        ),
      }}
      pagination={pagination ? { ...pagination, onPageChange: goToPage } : undefined}
    >
      {rows.length === 0 ? (
        <NoRecordsFound
          icon={Package}
          title={t('No undistributed sales')}
          description={t('Posted invoices with remaining distribution balance appear here.')}
          hasFilters={Boolean(toolbar.search)}
          onClearFilters={() => toolbar.applySearch(true)}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
