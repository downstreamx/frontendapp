import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, CheckCircle, Eye, Trash2, X } from 'lucide-react'
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
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'
import { PaymentStatusBadge } from '../components/PaymentStatusBadge'
import { SupplierPaymentCreateDialog } from '../components/SupplierPaymentCreateDialog'
import {
  canDeleteSupplierPayment,
  supplierPaymentDeleteMessage,
} from '../supplier-payment-delete'
import {
  deleteSupplierPayment,
  fetchSupplierPaymentsIndexMeta,
  listSupplierPaymentsPaginated,
  updateSupplierPaymentStatus,
  type SupplierPaymentRow,
} from '../payments-api'

type AppliedFilters = {
  supplier_id: string
  bank_account_id: string
  status: string
  date_range: string
}

const defaultFilters: AppliedFilters = {
  supplier_id: '',
  bank_account_id: '',
  status: '',
  date_range: '',
}

function SupplierPaymentRowActions({
  row,
  canView,
  canClear,
  canDelete,
  onView,
  onClear,
  onCancel,
  onDelete,
}: {
  row: SupplierPaymentRow
  canView: boolean
  canClear: boolean
  canDelete: boolean
  onView: () => void
  onClear: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const isPending = row.status === 'pending'

  return (
    <div className="flex gap-1">
      {isPending && canClear ? (
        <>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                onClick={onClear}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Mark as Cleared')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Cancel Payment')}</p>
            </TooltipContent>
          </Tooltip>
        </>
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
      {isPending && canDelete ? (
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

export function SupplierPaymentsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(() => ({
    supplier_id: searchParams.get('supplier_id') ?? '',
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    supplier_id: searchParams.get('supplier_id') ?? '',
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_range: searchParams.get('date_range') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  useAccountPageChrome(t('Manage Supplier Payments'), t('Supplier payments'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-supplier-payments',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-supplier-payments',
  )
  const canClear = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'cleared-supplier-payments',
  )
  const canDeletePerm = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-supplier-payments',
  )

  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    payment_number?: string
  } | null>(null)

  const metaQuery = useQuery({
    queryKey: ['supplier-payments', 'index-meta'],
    queryFn: fetchSupplierPaymentsIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.supplier_id) params.supplier_id = appliedFilters.supplier_id
    if (appliedFilters.bank_account_id) params.bank_account_id = appliedFilters.bank_account_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.date_range) params.date_range = appliedFilters.date_range
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-payments', listParams],
    queryFn: () => listSupplierPaymentsPaginated(listParams),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'cleared' | 'cancelled' }) =>
      updateSupplierPaymentStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'cleared'
          ? t('Payment marked as cleared.')
          : t('Payment cancelled.'),
      )
      void queryClient.invalidateQueries({ queryKey: ['supplier-payments'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update payment status'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (paymentId: number) => deleteSupplierPayment(paymentId),
    onSuccess: () => {
      toast.success(t('The supplier payment has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['supplier-payments'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete payment'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const supplierOptions = useMemo(
    () => toSupplierLookupOptions(metaQuery.data?.suppliers ?? []),
    [metaQuery.data?.suppliers],
  )
  const bankAccounts = metaQuery.data?.bank_accounts ?? []

  const activeFilterCount = [
    appliedFilters.supplier_id,
    appliedFilters.bank_account_id,
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
    if (filters.bank_account_id) next.set('bank_account_id', filters.bank_account_id)
    else next.delete('bank_account_id')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    if (filters.date_range) next.set('date_range', filters.date_range)
    else next.delete('date_range')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<SupplierPaymentRow>[] = [
    {
      key: 'payment_number',
      header: t('Payment Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(paths.account.supplierPayments.show(row.id))}
          >
            {String(value ?? `#${row.id}`)}
          </button>
        ) : (
          String(value ?? `#${row.id}`)
        ),
    },
    {
      key: 'supplier',
      header: t('Supplier'),
      render: (_, row) => row.supplier?.company_name?.trim() || row.supplier?.name || '—',
    },
    {
      key: 'payment_date',
      header: t('Payment Date'),
      sortable: true,
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    {
      key: 'payment_amount',
      header: t('Amount'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'bank_account',
      header: t('Bank Account'),
      render: (_, row) => row.bank_account?.account_name ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <SupplierPaymentRowActions
          row={row}
          canView={canView}
          canClear={canClear}
          canDelete={
            canDeletePerm &&
            canDeleteSupplierPayment(row, auth.permissions, auth.roles, auth.user?.type)
          }
          onView={() => navigate(paths.account.supplierPayments.show(row.id))}
          onClear={() => statusMutation.mutate({ id: row.id, status: 'cleared' })}
          onCancel={() => statusMutation.mutate({ id: row.id, status: 'cancelled' })}
          onDelete={() =>
            setDeleteTarget({
              id: row.id,
              payment_number: row.payment_number,
            })
          }
        />
      ),
    },
  ]

  const showActionsColumn = canView || canClear || canDeletePerm
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Supplier payments')}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search payments...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Bank Account')}</Label>
                <Select
                  value={draftFilters.bank_account_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      bank_account_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All bank accounts')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All bank accounts')}</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.account_name}
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
                    <SelectItem value="pending">{t('Pending')}</SelectItem>
                    <SelectItem value="cleared">{t('Cleared')}</SelectItem>
                    <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Payment Date')}</Label>
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
            icon={Banknote}
            title={t('No payments yet')}
            description={t('Record a payment against outstanding invoices.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-supplier-payments"
            onCreateClick={() => setCreateOpen(true)}
            createButtonText={t('Create payment')}
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

      <SupplierPaymentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete payment')}
        message={
          deleteTarget
            ? supplierPaymentDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this payment?')
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
