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
import { formatDateTime } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { listEmptyTrucksInTransit, type EmptyTruckInTransitRow } from '../distribution-api'
import { TruckOperationalStatusBadge } from '@/features/fleet/components/TruckOperationalStatusBadge'
import { TableTruckAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { formatQuantity } from '@/lib/format-quantity'

export function EmptyTrucksInTransitIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '15',
    initialSearch: searchParams.get('search') ?? '',
  })
  const page = searchParams.get('page') ?? '1'

  const title = t('Empty Truck in Transit')
  const description = t(
    'Trucks that are empty and released (operational status: empty / unbridged), ready for a new bridging assignment.',
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
    queryKey: ['distribution', 'empty-trucks-in-transit', listParams],
    queryFn: () => listEmptyTrucksInTransit(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<EmptyTruckInTransitRow>[] = [
    {
      key: 'plate_number',
      header: t('Truck'),
      render: (_, row) => (
        <Link to={paths.fleet.truckShow(row.id)} className="inline-block hover:underline">
          <TableTruckAvatarCell avatar={row.avatar} label={row.plate_number} />
        </Link>
      ),
    },
    {
      key: 'operational_status',
      header: t('Operational status'),
      render: (_, row) => <TruckOperationalStatusBadge status={row.operational_status} />,
    },
    {
      key: 'truck_provider',
      header: t('Truck provider'),
      render: (_, row) => row.truck_provider?.name ?? '—',
    },
    {
      key: 'capacity_litres',
      header: t('Capacity'),
      render: (_, row) => {
        const litres = row.capacity_litres
        return litres != null && litres !== '' ? formatQuantity(litres, { unit: 'L' }) : '—'
      },
    },
    {
      key: 'released_at',
      header: t('Last updated'),
      render: (_, row) => (row.released_at ? formatDateTime(row.released_at) : '—'),
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
        searchPlaceholder: t('Search by plate, make, or model...'),
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
          title={t('No empty trucks')}
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
