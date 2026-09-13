import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Edit,
  Eye,
  FileText,
  Receipt,
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
import { toCustomerLookupOptions } from '@/features/_shared/operations-lookups'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { postInvoice } from '@/features/commercial/api'
import { isCommercialInvoicePastDue } from '@/lib/commercial-invoice-overdue'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import {
  salesDistributionStatusBadgeClass,
  salesDistributionStatusLabel,
} from '@/features/bridging/bridging-status-ui'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'
import {
  getSalesInvoiceStatusBadgeClasses,
  SALES_INVOICE_STATUS_OPTIONS,
} from '../sales-invoice-utils'
import { salesInvoiceDeleteMessage } from '../sales-invoice-delete'
import {
  deleteSalesInvoice,
  fetchSalesInvoicesIndexMeta,
  listSalesInvoicesPaginated,
  type SalesInvoiceRow,
} from '../sales-invoices-api'

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

function SalesInvoiceRowActions({
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
  row: SalesInvoiceRow
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

export function SalesInvoicesIndexPage() {
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

  useSalesPageChrome(t('Manage Sales Invoices'), t('Sales Invoices'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-sales-invoices',
  )
  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-sales-invoices')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-sales-invoices')
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-sales-invoices',
  )
  const canPost = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'post-sales-invoices')
  const canPrint = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'print-sales-invoices')

  const metaQuery = useQuery({
    queryKey: queryKeys.sales.invoices.indexMeta(),
    queryFn: fetchSalesInvoicesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
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
    queryKey: queryKeys.sales.invoices.list(listParams),
    queryFn: () => listSalesInvoicesPaginated(listParams),
  })

  const postMutation = useMutation({
    mutationFn: (id: number) => postInvoice('sales', id),
    onSuccess: () => {
      toast.success(t('The sales invoice has been posted.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.all() })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post invoice'))),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; invoice_number: string } | null>(
    null,
  )

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: number) => deleteSalesInvoice(invoiceId),
    onSuccess: () => {
      toast.success(t('The sales invoice has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.all() })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete invoice'))),
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

  const columns: Column<SalesInvoiceRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(`${paths.sales.invoices}/${row.id}`)}
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
      header: t('Balance'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'total_distributed_qty',
      header: t('Distributed Qty'),
      render: (_, row) =>
        row.total_distributed_qty != null ? formatQuantity(row.total_distributed_qty) : '—',
    },
    {
      key: 'distribution_status',
      header: t('Distribution'),
      render: (_, row) => {
        const status = row.distribution_status
        if (!status) return '—'
        return (
          <span className={salesDistributionStatusBadgeClass(status)}>
            {salesDistributionStatusLabel(status, t)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getSalesInvoiceStatusBadgeClasses(row.display_status)}>
          {statusLabel(row.display_status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <SalesInvoiceRowActions
          row={row}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          canPost={canPost}
          canPrint={canPrint}
          onView={() => navigate(`${paths.sales.invoices}/${row.id}`)}
          onEdit={() => navigate(`${paths.sales.invoices}/${row.id}/edit`)}
          onDelete={() =>
            setDeleteTarget({ id: row.id, invoice_number: row.invoice_number })
          }
          onPost={() => postMutation.mutate(row.id)}
          onPrint={() =>
            window.open(`${paths.sales.invoices}/${row.id}?print=1&download=pdf`, '_blank')
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
        title={t('Sales invoices')}
        canCreate={canCreate}
        onCreateClick={() => navigate(`${paths.sales.invoices}/create`)}
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
                    {SALES_INVOICE_STATUS_OPTIONS.map((status) => (
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
            icon={Receipt}
            title={t('No sales invoices found')}
            description={t('Get started by creating your first sales invoice.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-sales-invoices"
            onCreateClick={() => navigate(`${paths.sales.invoices}/create`)}
            createButtonText={t('Create invoice')}
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
        title={t('Delete Sales Invoice')}
        message={
          deleteTarget
            ? salesInvoiceDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this sales invoice?')
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
