import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle, Eye, RotateCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LookupSelectContent } from '@/components/forms/entity-select'
import { toCustomerLookupOptions } from '@/features/_shared/operations-lookups'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'
import {
  getSalesReturnStatusBadgeClasses,
  SALES_RETURN_STATUS_OPTIONS,
} from '../sales-return-utils'
import { canDeleteSalesReturn, salesReturnDeleteMessage } from '../sales-return-delete'
import {
  approveSalesReturn,
  completeSalesReturn,
  deleteSalesReturn,
  fetchSalesReturnsIndexMeta,
  listSalesReturnsPaginated,
  type SalesReturnRow,
} from '../sales-returns-api'

type AppliedFilters = {
  customer_id: string
  depot_id: string
  status: string
  date_range: string
}

const defaultFilters: AppliedFilters = {
  customer_id: '',
  depot_id: '',
  status: '',
  date_range: '',
}

function SalesReturnRowActions({
  row,
  canView,
  canApprove,
  canComplete,
  canDelete,
  onView,
  onApprove,
  onComplete,
  onDelete,
}: {
  row: SalesReturnRow
  canView: boolean
  canApprove: boolean
  canComplete: boolean
  canDelete: boolean
  onView: () => void
  onApprove: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-1">
      {row.status === 'draft' && canApprove ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
              onClick={onApprove}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Approve Return')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {row.status === 'approved' && canComplete ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
              onClick={onComplete}
            >
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Complete Return')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {canView ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('View')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {row.status === 'draft' && canDelete ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Delete')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

export function SalesReturnsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(() => ({
    customer_id: searchParams.get('customer_id') ?? '',
    depot_id: searchParams.get('depot_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    customer_id: searchParams.get('customer_id') ?? '',
    depot_id: searchParams.get('depot_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  useSalesPageChrome(t('Manage Sales Returns'), t('Sales Returns'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-sales-return-invoices',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-sales-return-invoices',
  )
  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-sales-returns-invoices',
  )
  const canComplete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'complete-sales-returns-invoices',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-sales-return-invoices',
  )

  const metaQuery = useQuery({
    queryKey: ['sales-returns', 'index-meta'],
    queryFn: fetchSalesReturnsIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.customer_id) params.customer_id = appliedFilters.customer_id
    if (appliedFilters.depot_id) params.depot_id = appliedFilters.depot_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.date_range) params.date_range = appliedFilters.date_range
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-returns', listParams],
    queryFn: () => listSalesReturnsPaginated(listParams),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; return_number: string } | null>(
    null,
  )

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSalesReturn(id),
    onSuccess: () => {
      toast.success(t('The sales return has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete return'))),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveSalesReturn(id),
    onSuccess: () => {
      toast.success(t('The sales return has been approved.'))
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve return'))),
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeSalesReturn(id),
    onSuccess: () => {
      toast.success(t('The sales return has been completed.'))
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to complete return'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const customerOptions = useMemo(
    () => toCustomerLookupOptions(metaQuery.data?.customers ?? []),
    [metaQuery.data?.customers],
  )
  const depots = metaQuery.data?.depots ?? []

  const activeFilterCount = [
    appliedFilters.customer_id,
    appliedFilters.depot_id,
    appliedFilters.status,
    appliedFilters.date_range,
  ].filter(Boolean).length

  const hasFilters = Boolean(toolbar.search || activeFilterCount > 0)

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const syncFiltersToUrl = (filters: AppliedFilters, search: string) => {
    const next = new URLSearchParams(searchParams)
    if (search) next.set('search', search)
    else next.delete('search')
    if (filters.customer_id) next.set('customer_id', filters.customer_id)
    else next.delete('customer_id')
    if (filters.depot_id) next.set('depot_id', filters.depot_id)
    else next.delete('depot_id')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    if (filters.date_range) next.set('date_range', filters.date_range)
    else next.delete('date_range')
    next.set('page', '1')
    setSearchParams(next)
  }

  const statusLabel = (status: string) =>
    t(status.charAt(0).toUpperCase() + status.slice(1))

  const columns: Column<SalesReturnRow>[] = [
    {
      key: 'return_number',
      header: t('Return Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(paths.sales.returnShow(row.id))}
          >
            {String(value)}
          </button>
        ) : (
          String(value)
        ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.company_name || row.customer?.name || '—',
    },
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name || '—',
    },
    {
      key: 'return_date',
      header: t('Return Date'),
      sortable: true,
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'total_amount',
      header: t('Total Amount'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'items',
      header: t('Items'),
      render: (_, row) => {
        const items = row.items ?? []
        if (items.length === 0) return '—'
        return (
          <div className="space-y-0.5 text-sm">
            {items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="truncate">{item.product?.name ?? '—'}</span>
                <span className="text-muted-foreground">×{item.return_quantity}</span>
              </div>
            ))}
            {items.length > 2 ? (
              <div className="text-xs text-muted-foreground">
                +{items.length - 2} {t('more items')}
              </div>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getSalesReturnStatusBadgeClasses(row.status)}>
          {statusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <SalesReturnRowActions
          row={row}
          canView={canView}
          canApprove={canApprove}
          canComplete={canComplete}
          canDelete={canDelete}
          onView={() => navigate(paths.sales.returnShow(row.id))}
          onApprove={() => approveMutation.mutate(row.id)}
          onComplete={() => completeMutation.mutate(row.id)}
          onDelete={() => setDeleteTarget({ id: row.id, return_number: row.return_number })}
        />
      ),
    },
  ]

  const showActionsColumn = canView || canApprove || canComplete || canDelete
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Sales returns')}
        canCreate={canCreate}
        onCreateClick={() => navigate(paths.sales.returnCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search returns...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
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
          onApplyFilters: () => {
            setAppliedFilters(draftFilters)
            syncFiltersToUrl(draftFilters, toolbar.search)
            toolbar.applySearch()
          },
          onClearFilters: () => {
            setDraftFilters(defaultFilters)
            setAppliedFilters(defaultFilters)
            toolbar.setDraftSearch('')
            toolbar.applySearch(true)
            setSearchParams({ per_page: toolbar.perPage })
          },
          filtersPanel: (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Customer')}</Label>
                <Select
                  value={draftFilters.customer_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      customer_id: value === 'all' ? '' : value,
                    }))
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
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Depot')}</Label>
                <Select
                  value={draftFilters.depot_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      depot_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All depots')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All depots')}</SelectItem>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={String(depot.id)}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      status: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {SALES_RETURN_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Return Date')}</Label>
                <DateRangePicker
                  value={draftFilters.date_range}
                  onChange={(date_range) => setDraftFilters((prev) => ({ ...prev, date_range }))}
                  placeholder={t('Select date range')}
                />
              </div>
            </>
          ),
        }}
        pagination={
          pagination ? { ...pagination, onPageChange: goToPage } : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={RotateCcw}
            title={t('No sales returns found')}
            description={t('Get started by creating your first sales return.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-sales-return-invoices"
            onCreateClick={() => navigate(paths.sales.returnCreate)}
            createButtonText={t('Create return')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable
            embedded
            data={rows}
            columns={visibleColumns}
            onSort={setSort}
            sortKey={sortField}
            sortDirection={sortDirection}
          />
        )}
      </ModuleListCard>

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Sales Return')}
        message={
          deleteTarget
            ? salesReturnDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this sales return?')
        }
        confirmText={t('Delete')}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
