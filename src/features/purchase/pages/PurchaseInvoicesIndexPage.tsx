import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Edit,
  Eye,
  FileText,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
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
import { toSupplierLookupOptions } from '@/features/_shared/operations-lookups'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { postInvoice } from '@/features/commercial/api'
import { isCommercialInvoicePastDue } from '@/lib/commercial-invoice-overdue'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import {
  purchaseBridgingStatusBadgeClass,
  purchaseBridgingStatusLabel,
} from '@/features/bridging/bridging-status-ui'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { usePurchasePageChrome } from '../hooks/use-purchase-page-chrome'
import {
  getPurchaseInvoiceStatusBadgeClasses,
  PURCHASE_INVOICE_STATUS_OPTIONS,
} from '../purchase-invoice-utils'
import { purchaseInvoiceDeleteMessage } from '../purchase-invoice-delete'
import {
  deletePurchaseInvoice,
  fetchPurchaseInvoicesIndexMeta,
  listPurchaseInvoicesPaginated,
  type PurchaseInvoiceRow,
  type PurchaseInvoicesFooter,
} from '../purchase-invoices-api'

type AppliedFilters = {
  supplier_id: string
  depot_id: string
  status: string
  date_range: string
}

const defaultFilters: AppliedFilters = {
  supplier_id: '',
  depot_id: '',
  status: '',
  date_range: '',
}

function PurchaseInvoiceRowActions({
  row,
  canView,
  canEdit,
  canDelete,
  canPost,
  canPrint,
  onView,
  onEdit,
  onDelete,
  onPost,
  onPrint,
}: {
  row: PurchaseInvoiceRow
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canPost: boolean
  canPrint: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onPost: () => void
  onPrint: () => void
}) {
  const { t } = useTranslation()
  const isDraft = row.status === 'draft'

  return (
    <div className="flex gap-1">
      {canPrint ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
              onClick={onPrint}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Download PDF')}</p>
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
      {isDraft && canPost ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
              onClick={onPost}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Post invoice to finalize and create journal entries')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {isDraft && canEdit ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Edit')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {isDraft && canDelete ? (
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

export function PurchaseInvoicesIndexPage() {
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
    supplier_id: searchParams.get('supplier_id') ?? '',
    depot_id: searchParams.get('depot_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    supplier_id: searchParams.get('supplier_id') ?? '',
    depot_id: searchParams.get('depot_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  usePurchasePageChrome(t('Manage Purchase Invoices'), t('Purchase Invoices'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-purchase-invoices',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-purchase-invoices',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-purchase-invoices',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-purchase-invoices',
  )
  const canPost = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'post-purchase-invoices',
  )
  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-purchase-invoices',
  )

  const metaQuery = useQuery({
    queryKey: queryKeys.purchase.invoices.indexMeta(),
    queryFn: fetchPurchaseInvoicesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.supplier_id) params.supplier_id = appliedFilters.supplier_id
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
    queryKey: queryKeys.purchase.invoices.list(listParams),
    queryFn: () => listPurchaseInvoicesPaginated(listParams),
  })

  const postMutation = useMutation({
    mutationFn: (id: number) => postInvoice('purchase', id),
    onSuccess: () => {
      toast.success(t('The purchase invoice has been posted.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.invoices.all() })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post invoice'))),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; invoice_number: string } | null>(
    null,
  )

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: number) => deletePurchaseInvoice(invoiceId),
    onSuccess: () => {
      toast.success(t('The purchase invoice has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.invoices.all() })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete invoice'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const footer: PurchaseInvoicesFooter | undefined = data?.footer
  const supplierOptions = useMemo(
    () => toSupplierLookupOptions(metaQuery.data?.suppliers ?? []),
    [metaQuery.data?.suppliers],
  )
  const depots = metaQuery.data?.depots ?? []

  const activeFilterCount = [
    appliedFilters.supplier_id,
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
    if (filters.supplier_id) next.set('supplier_id', filters.supplier_id)
    else next.delete('supplier_id')
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

  const columns: Column<PurchaseInvoiceRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(`${paths.purchase.invoices}/${row.id}`)}
          >
            {String(value)}
          </button>
        ) : (
          String(value)
        ),
    },
    {
      key: 'supplier',
      header: t('Supplier'),
      render: (_, row) => row.supplier?.company_name || row.supplier?.name || '—',
    },
    {
      key: 'invoice_date',
      header: t('Invoice Date'),
      sortable: true,
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'due_date',
      header: t('Due Date'),
      sortable: true,
      render: (value, row) => {
        const pastDue = isCommercialInvoicePastDue(row)
        return (
          <div>
            <span className={pastDue ? 'font-medium text-destructive' : ''}>
              {formatDate(String(value))}
            </span>
            {pastDue ? (
              <div className="mt-0.5 text-xs font-medium text-destructive">{t('Overdue')}</div>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'subtotal',
      header: t('Subtotal'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'tax_amount',
      header: t('Tax'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'total_amount',
      header: t('Total Amount'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'balance_amount',
      header: t('Outstanding Balance'),
      sortable: true,
      render: (value) => {
        const amount = Number(value)
        return (
          <span
            className={
              amount !== 0 ? 'font-medium text-red-600 dark:text-red-400' : undefined
            }
          >
            {formatCurrency(amount)}
          </span>
        )
      },
    },
    {
      key: 'total_bridged_qty',
      header: t('Bridged Qty'),
      render: (_, row) =>
        row.total_bridged_qty != null ? formatQuantity(row.total_bridged_qty) : '—',
    },
    {
      key: 'bridging_status',
      header: t('Bridging'),
      render: (_, row) => {
        const status = row.bridging_status
        if (!status) return '—'
        return (
          <span className={purchaseBridgingStatusBadgeClass(status)}>
            {purchaseBridgingStatusLabel(status, t)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getPurchaseInvoiceStatusBadgeClasses(row.display_status)}>
          {statusLabel(row.display_status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <PurchaseInvoiceRowActions
          row={row}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          canPost={canPost}
          canPrint={canPrint}
          onView={() => navigate(`${paths.purchase.invoices}/${row.id}`)}
          onEdit={() => navigate(`${paths.purchase.invoices}/${row.id}/edit`)}
          onDelete={() =>
            setDeleteTarget({ id: row.id, invoice_number: row.invoice_number })
          }
          onPost={() => postMutation.mutate(row.id)}
          onPrint={() =>
            window.open(`${paths.purchase.invoices}/${row.id}?print=1&download=pdf`, '_blank')
          }
        />
      ),
    },
  ]

  const showActionsColumn = canView || canEdit || canDelete || canPost || canPrint
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Purchase invoices')}
        canCreate={canCreate}
        onCreateClick={() => navigate(`${paths.purchase.invoices}/create`)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search invoices...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Supplier')}</Label>
                <Select
                  value={draftFilters.supplier_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      supplier_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All suppliers')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All suppliers')}</SelectItem>}
                      options={supplierOptions}
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
                    {PURCHASE_INVOICE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Invoice Date')}</Label>
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
          pagination
            ? {
                ...pagination,
                onPageChange: goToPage,
              }
            : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={ShoppingCart}
            title={t('No purchase invoices found')}
            description={t('Get started by creating your first purchase invoice.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-purchase-invoices"
            onCreateClick={() => navigate(`${paths.purchase.invoices}/create`)}
            createButtonText={t('Create invoice')}
            className="h-auto py-8"
          />
        ) : (
          <>
            <DataTable
              embedded
              data={rows}
              columns={visibleColumns}
              onSort={setSort}
              sortKey={sortField}
              sortDirection={sortDirection}
            />
            {footer ? (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <p className="font-semibold">{formatCurrency(footer.subtotal)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Tax')}</span>
                  <p className="font-semibold">{formatCurrency(footer.tax_amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Total')}</span>
                  <p className="font-semibold">{formatCurrency(footer.total_amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Balance')}</span>
                  <p className="font-semibold">{formatCurrency(footer.balance_amount)}</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </ModuleListCard>

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Purchase Invoice')}
        message={
          deleteTarget
            ? purchaseInvoiceDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this purchase invoice?')
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
