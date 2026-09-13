import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { serialOffsetFromPagination } from '@/lib/table-columns'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { queryKeys } from '@/lib/query-keys'
import { useBridgingPageChrome } from '../hooks/use-bridging-page-chrome'
import { TruckLoadActions } from '../components/TruckLoadActions'
import { listTruckLoads, type TruckLoad } from '../bridging-api'

export function BridgingsIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '15',
    initialSearch: searchParams.get('search') ?? '',
  })
  const page = searchParams.get('page') ?? '1'
  const phaseFilter = searchParams.get('phase') ?? ''

  useBridgingPageChrome(t('Distributed Trucks'))

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (phaseFilter) params.phase = phaseFilter
    return params
  }, [page, phaseFilter, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.bridging.truckLoads.list(listParams),
    queryFn: () => listTruckLoads(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const serialOffset = serialOffsetFromPagination(pagination)

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<TruckLoad>[] = [
    {
      key: 'loading_date',
      header: t('Date'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    {
      key: 'loading_depot',
      header: t('Loading Depot'),
      render: (_, row) => row.loading_depot?.name ?? '—',
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.name ?? '—',
    },
    {
      key: 'unit_rate',
      header: t('Rate'),
      render: (_, row) =>
        row.unit_rate != null ? formatCurrency(row.unit_rate) : '—',
    },
    {
      key: 'quantity',
      header: t('Qty'),
      render: (value, row) => formatQuantity(value ?? 0, { unit: row.quantity_unit ?? 'L' }),
    },
    {
      key: 'destination',
      header: t('Destination'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'product',
      header: t('Product'),
      render: (_, row) => row.product?.name ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => <TruckLoadActions load={row} />,
    },
  ]

  return (
    <ModuleListCard
      title={t('Distributed Trucks')}
      description={t(
        'All truck loads from bridging and customer distribution. Open a row for driver, purchase, and sales details.',
      )}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: (cleared) => toolbar.applySearch(cleared),
        searchPlaceholder: t('Search truck loads...'),
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
          icon={Truck}
          title={t('No distributed trucks')}
          description={t('Assign bridged trucks from a sales invoice to see them here.')}
          hasFilters={Boolean(toolbar.search || phaseFilter)}
          onClearFilters={() => toolbar.applySearch(true)}
          className="h-auto py-8"
        />
      ) : (
        <DataTable
          embedded
          data={rows}
          columns={columns}
          showSerialColumn
          serialPageOffset={serialOffset}
        />
      )}
    </ModuleListCard>
  )
}
