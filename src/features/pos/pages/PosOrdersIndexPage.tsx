import { useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LookupSelectContent } from '@/components/forms/entity-select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { listPosSalesPaginated, type PosSale } from '../pos-api'
import { usePosMeta } from '../hooks/use-pos-meta'

type AppliedFilters = {
  customer_id: string
  depot_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  customer_id: '',
  depot_id: '',
  status: '',
}

function isEditableStatus(status: string): boolean {
  return status.toLowerCase() === 'pending'
}

export function PosOrdersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('POS Orders'),
    breadcrumbs: [
      { label: t('POS'), url: paths.pos.index },
      { label: t('Orders') },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.customer_id) params.customer_id = appliedFilters.customer_id
    if (appliedFilters.depot_id) params.depot_id = appliedFilters.depot_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos', 'sales', listParams],
    queryFn: () => listPosSalesPaginated(listParams),
  })

  const { customerOptions } = usePosMeta()

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      return next
    })
  }

  const orderPermission = 'view-pos-orders'

  const columns: Column<PosSale>[] = [
    {
      key: 'sale_number',
      header: t('Sale number'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.pos.show(row.id)} className="text-primary hover:underline">
          {row.sale_number ?? `#${row.id}`}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.name ?? t('Walk-in customer'),
    },
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name ?? '—',
    },
    {
      key: 'items_total',
      header: t('Total'),
      render: (_, row) =>
        row.items_total != null && row.items_total !== '' ? formatCurrency(row.items_total) : '—',
    },
    {
      key: 'pos_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => formatDate(row.pos_date),
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <FleetStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          viewPermission={orderPermission}
          printPermission={orderPermission}
          editPermission="manage-pos"
          onView={() => navigate(paths.pos.show(row.id))}
          onPrint={() => navigate(paths.pos.print(row.id))}
          onEdit={
            isEditableStatus(row.status) ? () => navigate(paths.pos.edit(row.id)) : undefined
          }
        />
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('POS Orders')}
      description={t('Search, filter, and open POS sales. Use Add POS to record a new sale at the register.')}
      canCreate
      onCreateClick={() => navigate(paths.pos.create)}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search orders...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('Customer')}</Label>
              <Select
                value={draftFilters.customer_id || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, customer_id: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All customers')} />
                </SelectTrigger>
                <LookupSelectContent
                    leadingItem={<SelectItem value="all">{t('All customers')}</SelectItem>}
                    options={customerOptions}
                  />
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Depot')}</Label>
              <Select
                value={draftFilters.depot_id || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, depot_id: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All depots')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All depots')}</SelectItem>
                  {(meta?.depots ?? []).map((depot) => (
                    <SelectItem key={depot.id} value={String(depot.id)}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select
                value={draftFilters.status || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All statuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All statuses')}</SelectItem>
                  {(meta?.statuses ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : undefined,
      }}
      pagination={pagination}
      onPageChange={(p) =>
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('page', String(p))
          return next
        })
      }
    >
      {rows.length === 0 && !isLoading ? (
        <NoRecordsFound
          icon={ShoppingCart}
          title={t('No orders found')}
          description={t('Get started by creating your first POS order.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          createPermission="create-pos"
          onCreateClick={() => navigate(paths.pos.create)}
          createButtonText={t('Add POS')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={setSort}
        />
      )}
    </ModuleListCard>
  )
}
