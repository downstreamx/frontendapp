import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatQuantity } from '@/lib/format-quantity'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { listTrucksInTransit, type TruckLoad } from '@/features/bridging/bridging-api'
import { truckLoadPhaseLabel } from '@/features/bridging/bridging-status-ui'
import { TruckLoadActions } from '@/features/bridging/components/TruckLoadActions'
import { TableTruckAvatarCell } from '@/features/shared/components/table-avatar-cells'

export function TrucksInTransitIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '15',
    initialSearch: searchParams.get('search') ?? '',
  })
  const page = searchParams.get('page') ?? '1'

  const title = t('Goods in Transit')
  const description = t(
    'Truck loads carrying product: en route from supplier after bridging, at depot, or distributing to customers.',
  )

  usePageChrome({
    pageTitle: title,
    breadcrumbs: [
      { label: t('Distribution'), url: paths.distribution.loadingSchedules },
      { label: title },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    return params
  }, [page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['distribution', 'trucks-in-transit', 'goods', listParams],
    queryFn: () => listTrucksInTransit('goods', listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<TruckLoad>[] = [
    {
      key: 'load_number',
      header: t('Load #'),
      render: (value, row) => (
        <Link
          to={paths.bridging.truckLoadShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {String(value ?? row.load_number ?? `#${row.id}`)}
        </Link>
      ),
    },
    {
      key: 'phase',
      header: t('Status'),
      render: (_, row) => truckLoadPhaseLabel(row.phase, t),
    },
    {
      key: 'truck',
      header: t('Truck'),
      render: (_, row) => (
        <TableTruckAvatarCell
          avatar={row.truck?.avatar}
          label={row.truck?.plate_number ?? '—'}
        />
      ),
    },
    {
      key: 'loading_depot',
      header: t('Loading depot'),
      render: (_, row) => row.loading_depot?.name ?? '—',
    },
    {
      key: 'quantity',
      header: t('Quantity'),
      render: (value, row) => formatQuantity(value ?? 0, { unit: row.quantity_unit ?? 'L' }),
    },
    {
      key: 'destination',
      header: t('Destination'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'loading_date',
      header: t('Loading date'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => <TruckLoadActions load={row} />,
    },
  ]

  return (
    <ModuleListCard
      title={title}
      description={description}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: (cleared) => toolbar.applySearch(cleared),
        searchPlaceholder: t('Search by load, truck, or destination...'),
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
          title={t('No trucks in transit')}
          description={description}
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
