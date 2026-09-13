import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { DistributionFormDialog } from './DistributionFormDialog'
import { canEditDistributionRecord } from '../distribution-workflow'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { formatDate } from '@/utils/helpers'
import { LookupSelectContent } from '@/components/forms/entity-select'
import {
  toProductLookupOptions,
  toTruckLookupOptions,
} from '@/features/_shared/operations-lookups'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import {
  TableProductAvatarCell,
  TableTruckAvatarCell,
} from '@/features/shared/components/table-avatar-cells'
import { resolveScheduleDestination } from './distribution-show-utils'
import { buildScheduleProfileColumns } from './schedule-profile-columns'
import type { ScheduleViewProfile } from '../schedule-view-profiles'
import {
  advanceDistributionStatus,
  distributionAdvanceLabels,
  distributionListConfig,
  emptyDistributionListFilters,
  fetchDistributionIndexMeta,
  listDistributionResourcePaginated,
  postInventoryMovement,
  type DistributionField,
  type DistributionListFilterKey,
  type DistributionListFilters,
  type DistributionRow,
} from '../distribution-api'

type Props = {
  title: string
  singularTitle: string
  apiPath: string
  labelKeys: string[]
  fields: DistributionField[]
  showPath?: (id: number) => string
  viewProfile?: ScheduleViewProfile
  breadcrumbs?: Array<{ label: string; url?: string }>
  createButtonLabel?: string
  /** When true, the parent page owns usePageChrome (e.g. Fleet / Depot wrappers). */
  suppressPageChrome?: boolean
}

type AppliedFilters = DistributionListFilters

const defaultFilters = emptyDistributionListFilters

function personLabel(person: { first_name?: string; last_name?: string; email?: string }): string {
  const name = [person.first_name, person.last_name].filter(Boolean).join(' ')
  return name || person.email || '—'
}

function rowLabel(row: DistributionRow, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]
    if (val != null && val !== '') return String(val)
  }
  return `#${String(row.id ?? '—')}`
}

function prefillParamsFromSearch(
  searchParams: URLSearchParams,
  fields: DistributionField[],
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of fields) {
    const value = searchParams.get(field.name)
    if (value) out[field.name] = value
  }
  return out
}

export function DistributionListPage({
  title,
  singularTitle,
  apiPath,
  labelKeys,
  fields: fieldsProp,
  showPath,
  viewProfile,
  breadcrumbs,
  createButtonLabel,
  suppressPageChrome = false,
}: Props) {
  const fields = viewProfile?.formFields ?? fieldsProp
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const config = distributionListConfig[apiPath] ?? { filters: ['status'] as const }
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    for (const key of config.filters) {
      const value = appliedFilters[key]
      if (value) params[key] = value
    }
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['distribution', apiPath, listParams],
    queryFn: () => listDistributionResourcePaginated(apiPath, listParams),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['distribution', apiPath, 'index-meta'],
    queryFn: () => fetchDistributionIndexMeta(apiPath),
  })

  const truckFilterOptions = useMemo(
    () => toTruckLookupOptions(indexMeta?.trucks ?? []),
    [indexMeta?.trucks],
  )
  const productFilterOptions = useMemo(
    () => toProductLookupOptions(indexMeta?.products ?? []),
    [indexMeta?.products],
  )

  const advanceMutation = useMutation({
    mutationFn: (id: number) => advanceDistributionStatus(apiPath, id),
    onSuccess: () => {
      toast.success(t('Status updated'))
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update status'))),
  })

  const postMutation = useMutation({
    mutationFn: postInventoryMovement,
    onSuccess: () => {
      toast.success(t('Movement posted'))
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post movement'))),
  })

  const allRows = data?.rows ?? []
  const rows = useMemo(() => {
    if (!viewProfile || appliedFilters.status) return allRows
    return allRows.filter((row) =>
      viewProfile.visibleStatuses.includes(String(row.status ?? '')),
    )
  }, [allRows, appliedFilters.status, viewProfile])
  const pagination = data?.meta
  const activeFilterCount = config.filters.filter((key) => Boolean(appliedFilters[key])).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0
  const advanceLabels = viewProfile?.advanceLabels ?? distributionAdvanceLabels[apiPath] ?? {}
  const resolvedCreateLabel = createButtonLabel ?? viewProfile?.createButtonLabel ?? t('Create')

  const createPrefill = useMemo(
    () => prefillParamsFromSearch(searchParams, fields),
    [fields, searchParams],
  )

  const shouldOpenCreateFromQuery = useMemo(() => {
    if (searchParams.get('create') === '1') return true
    return Object.keys(createPrefill).some((key) => key !== 'truck_load_id')
  }, [createPrefill, searchParams])

  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (editParam) {
      const id = Number(editParam)
      if (!Number.isFinite(id)) return
      setDialogMode((mode) => (mode === 'edit' ? mode : 'edit'))
      setEditingId((current) => (current === id ? current : id))
      setDialogOpen((open) => (open ? open : true))
      return
    }

    const truckLoadFilter = searchParams.get('truck_load_id')
    if (truckLoadFilter && config.filters.includes('truck_load_id')) {
      setDraftFilters((f) =>
        f.truck_load_id === truckLoadFilter ? f : { ...f, truck_load_id: truckLoadFilter },
      )
      setAppliedFilters((f) =>
        f.truck_load_id === truckLoadFilter ? f : { ...f, truck_load_id: truckLoadFilter },
      )
    }

    if (shouldOpenCreateFromQuery) {
      setDialogMode((mode) => (mode === 'create' ? mode : 'create'))
      setEditingId((current) => (current == null ? current : null))
      setDialogOpen((open) => (open ? open : true))
    }
  }, [searchParams, config.filters, shouldOpenCreateFromQuery])

  const clearDialogSearchParams = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('edit')
      next.delete('create')
      for (const field of fields) {
        next.delete(field.name)
      }
      return next
    })
  }

  const openCreate = () => {
    setDialogMode('create')
    setEditingId(null)
    setDialogOpen(true)
  }

  const openEdit = (id: number) => {
    setDialogMode('edit')
    setEditingId(id)
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingId(null)
      clearDialogSearchParams()
    }
  }

  usePageChrome(
    suppressPageChrome
      ? null
      : {
          pageTitle: title,
          breadcrumbs: breadcrumbs ?? [{ label: t('Depots & Distribution') }, { label: title }],
        },
  )

  const setDraftFilter = (key: DistributionListFilterKey, value: string) => {
    setDraftFilters((f) => ({ ...f, [key]: value }))
  }

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

  const headerActions: ReactNode = (
    <Button size="sm" className="shrink-0 gap-1.5" onClick={openCreate}>
      <Plus className="h-4 w-4" aria-hidden />
      <span>{resolvedCreateLabel}</span>
    </Button>
  )

  const columns: Column<DistributionRow>[] = useMemo(() => {
    const profileColumns = viewProfile
      ? buildScheduleProfileColumns({
          profile: viewProfile,
          t,
          rows,
          page,
          perPage: toolbar.perPage,
          entityKey: viewProfile.entityKey,
        })
      : null

    const base: Column<DistributionRow>[] = profileColumns
      ? [...profileColumns]
      : [
          {
            key: 'label',
            header: t('Reference'),
            sortable: labelKeys.includes('schedule_number') || labelKeys.includes('transit_number'),
            render: (_, row) => {
              const label = rowLabel(row, labelKeys)
              return showPath ? (
                <Link to={showPath(row.id)} className="text-primary hover:underline">
                  {label}
                </Link>
              ) : (
                label
              )
            },
          },
        ]

    if (profileColumns) {
      // Profile columns already include status; append actions only.
    } else if (apiPath.includes('loading-schedules')) {
      base.push(
        { key: 'depot', header: t('From location / source'), render: (_, row) => String((row.depot as { name?: string })?.name ?? '—') },
        {
          key: 'product',
          header: t('Product'),
          render: (_, row) => {
            const product = row.product as { name?: string; image?: string | null } | undefined
            return (
              <TableProductAvatarCell
                image={product?.image}
                name={product?.name ?? '—'}
              />
            )
          },
        },
        {
          key: 'truck',
          header: t('Truck plate number'),
          render: (_, row) => (
            <TableTruckAvatarCell
              avatar={(row.truck as { avatar?: string | null } | undefined)?.avatar}
              label={truckLabel(row.truck as Parameters<typeof truckLabel>[0], row.truck_id as number)}
            />
          ),
        },
        {
          key: 'destination',
          header: t('Destination'),
          render: (_, row) => resolveScheduleDestination(row),
        },
        {
          key: 'scheduled_date',
          header: t('Date'),
          sortable: true,
          render: (_, row) => (row.scheduled_date ? formatDate(String(row.scheduled_date)) : '—'),
        },
        {
          key: 'planned_quantity',
          header: t('Qty'),
          render: (_, row) => formatQuantity(row.planned_quantity as number | string | undefined),
        },
      )
    } else if (apiPath.includes('receiving-schedules')) {
      base.push(
        {
          key: 'arrival_date',
          header: t('Date'),
          sortable: true,
          render: (_, row) => (row.arrival_date ? formatDate(String(row.arrival_date)) : '—'),
        },
        {
          key: 'product',
          header: t('Product'),
          render: (_, row) => {
            const product = row.product as { name?: string; image?: string | null } | undefined
            return (
              <TableProductAvatarCell image={product?.image} name={product?.name ?? '—'} />
            )
          },
        },
        {
          key: 'source',
          header: t('From location / source'),
          render: (_, row) =>
            String(
              (row.loadingDepot as { name?: string })?.name ??
                (row.loading_depot as { name?: string })?.name ??
                '—',
            ),
        },
        {
          key: 'quantity',
          header: t('Qty'),
          render: (_, row) => formatQuantity(row.quantity as number | string | undefined),
        },
        {
          key: 'truck',
          header: t('Truck plate number'),
          render: (_, row) => (
            <TableTruckAvatarCell
              avatar={(row.truck as { avatar?: string | null } | undefined)?.avatar}
              label={truckLabel(row.truck as Parameters<typeof truckLabel>[0], row.truck_id as number)}
            />
          ),
        },
        {
          key: 'destination',
          header: t('Destination'),
          render: (_, row) => resolveScheduleDestination(row),
        },
      )
    } else if (apiPath.includes('transits')) {
      base.push(
        { key: 'from', header: t('From'), render: (_, row) => String((row.from_depot as { name?: string })?.name ?? (row.fromDepot as { name?: string })?.name ?? '—') },
        { key: 'to', header: t('To'), render: (_, row) => String((row.to_depot as { name?: string })?.name ?? (row.toDepot as { name?: string })?.name ?? '—') },
        {
          key: 'truck',
          header: t('Truck'),
          render: (_, row) => truckLabel(row.truck as Parameters<typeof truckLabel>[0], row.truck_id as number),
        },
      )
    } else if (apiPath.includes('delivery-schedules')) {
      base.push(
        { key: 'depot', header: t('Depot'), render: (_, row) => String((row.depot as { name?: string })?.name ?? '—') },
        {
          key: 'scheduled_at',
          header: t('Scheduled'),
          sortable: true,
          render: (_, row) => (row.scheduled_at ? formatDate(String(row.scheduled_at)) : '—'),
        },
      )
    } else if (apiPath.includes('shortages') || apiPath.includes('overages')) {
      const qtyKey = apiPath.includes('shortages') ? 'shortage_quantity' : 'overage_quantity'
      base.push(
        {
          key: 'transit',
          header: t('Transit'),
          render: (_, row) => String((row.transit as { transit_number?: string })?.transit_number ?? '—'),
        },
        { key: 'product', header: t('Product'), render: (_, row) => String((row.product as { name?: string })?.name ?? '—') },
        {
          key: qtyKey,
          header: t('Variance'),
          render: (_, row) => formatQuantity(row[qtyKey] as number | string | undefined),
        },
      )
    } else if (apiPath.includes('inventory-movements')) {
      base.push(
        {
          key: 'type',
          header: t('Type'),
          render: (_, row) => String((row.movement_type as { name?: string })?.name ?? (row.movementType as { name?: string })?.name ?? '—'),
        },
        { key: 'depot', header: t('Depot'), render: (_, row) => String((row.depot as { name?: string })?.name ?? '—') },
        {
          key: 'movement_at',
          header: t('Date'),
          sortable: true,
          render: (_, row) => (row.movement_at ? formatDate(String(row.movement_at)) : '—'),
        },
      )
    }

    if (!profileColumns) {
      base.push({
        key: 'status',
        header: t('Status'),
        sortable: true,
        render: (_, row) => <FleetStatusBadge status={String(row.status ?? '')} />,
      })
    }

    base.push({
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => {
        const status = String(row.status ?? '')
        const advanceLabel = advanceLabels[status]
        const editable = viewProfile
          ? viewProfile.editableStatuses.includes(status)
          : status
            ? canEditDistributionRecord(apiPath, status)
            : false
        return (
          <div className="flex items-center gap-2">
            {config.supportsAdvance && advanceLabel ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate(row.id)}
              >
                {advanceLabel}
              </Button>
            ) : null}
            {config.supportsPost && status === 'draft' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={postMutation.isPending}
                onClick={() => postMutation.mutate(row.id)}
              >
                {t('Post')}
              </Button>
            ) : null}
            {editable ? (
              <TableRowActions onEdit={() => openEdit(row.id)} />
            ) : null}
          </div>
        )
      },
    })

    return base
  }, [
    advanceLabels,
    advanceMutation,
    apiPath,
    config.supportsAdvance,
    config.supportsPost,
    labelKeys,
    page,
    postMutation,
    rows,
    showPath,
    t,
    toolbar.perPage,
    viewProfile,
  ])

  return (
    <>
      <ModuleListCard
        title={title}
        description={t('Track distribution operations with search, filters, and status workflows.')}
        actions={headerActions}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search records...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {config.filters.includes('status') ? (
                <div className="space-y-1">
                  <Label>{t('Status')}</Label>
                  <Select
                    value={draftFilters.status || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('status', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All statuses')}</SelectItem>
                      {(viewProfile
                        ? viewProfile.visibleStatuses
                        : (indexMeta?.statuses ?? [])
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {viewProfile?.statusLabels[s] ?? s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('depot_id') ? (
                <div className="space-y-1">
                  <Label>{t('Depot')}</Label>
                  <Select
                    value={draftFilters.depot_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('depot_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All depots')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All depots')}</SelectItem>
                      {(indexMeta?.depots ?? []).map((depot) => (
                        <SelectItem key={depot.id} value={String(depot.id)}>
                          {depot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('truck_id') ? (
                <div className="space-y-1">
                  <Label>{t('Truck')}</Label>
                  <Select
                    value={draftFilters.truck_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('truck_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All trucks')} />
                    </SelectTrigger>
                    <LookupSelectContent
                        leadingItem={<SelectItem value="all">{t('All trucks')}</SelectItem>}
                        options={truckFilterOptions}
                      />
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('transit_id') ? (
                <div className="space-y-1">
                  <Label>{t('Transit')}</Label>
                  <Select
                    value={draftFilters.transit_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('transit_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All transits')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All transits')}</SelectItem>
                      {(indexMeta?.transits ?? []).map((transit) => (
                        <SelectItem key={transit.id} value={String(transit.id)}>
                          {transit.transit_number ?? `#${transit.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('product_id') ? (
                <div className="space-y-1">
                  <Label>{t('Product')}</Label>
                  <Select
                    value={draftFilters.product_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('product_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All products')} />
                    </SelectTrigger>
                    <LookupSelectContent
                        leadingItem={<SelectItem value="all">{t('All products')}</SelectItem>}
                        options={productFilterOptions}
                      />
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('depot_rep_id') ? (
                <div className="space-y-1">
                  <Label>{t('Depot rep')}</Label>
                  <Select
                    value={draftFilters.depot_rep_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('depot_rep_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All depot reps')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All depot reps')}</SelectItem>
                      {(indexMeta?.depot_reps ?? []).map((rep) => (
                        <SelectItem key={rep.id} value={String(rep.id)}>
                          {personLabel(rep)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('truck_load_id') ? (
                <div className="space-y-1">
                  <Label>{t('Truck load')}</Label>
                  <Select
                    value={draftFilters.truck_load_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilter('truck_load_id', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All truck loads')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All truck loads')}</SelectItem>
                      {(indexMeta?.truck_loads ?? []).map((record) => (
                        <SelectItem key={record.id} value={String(record.id)}>
                          {record.load_number ?? `#${record.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {config.filters.includes('date_from') ? (
                <div className="space-y-1">
                  <Label>{t('From date')}</Label>
                  <Input
                    type="date"
                    value={draftFilters.date_from}
                    onChange={(event) => setDraftFilter('date_from', event.target.value)}
                  />
                </div>
              ) : null}
              {config.filters.includes('date_to') ? (
                <div className="space-y-1">
                  <Label>{t('To date')}</Label>
                  <Input
                    type="date"
                    value={draftFilters.date_to}
                    onChange={(event) => setDraftFilter('date_to', event.target.value)}
                  />
                </div>
              ) : null}
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
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreateClick={openCreate}
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

      <DistributionFormDialog
        title={singularTitle}
        apiPath={apiPath}
        fields={fields}
        mode={dialogMode}
        recordId={editingId}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        prefillParams={dialogMode === 'create' ? createPrefill : undefined}
        defaultCreateStatus={viewProfile?.defaultCreateStatus}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
        }}
      />
    </>
  )
}
