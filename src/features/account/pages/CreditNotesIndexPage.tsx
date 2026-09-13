import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Eye, Trash2, XCircle } from 'lucide-react'
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
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { CreditNoteStatusBadge } from '../components/CreditNoteStatusBadge'
import {
  CREDIT_NOTE_STATUS_OPTIONS,
  formatCreditNoteStatusLabel,
} from '../credit-note-utils'
import { canDeleteCreditNote, creditNoteDeleteMessage } from '../credit-note-delete'
import {
  approveCreditNote,
  deleteCreditNote,
  fetchCreditNotesIndexMeta,
  listCreditNotesPaginated,
  type CreditNoteRow,
} from '../notes-api'

type AppliedFilters = {
  customer_id: string
  status: string
  sales_return_id: string
}

const defaultFilters: AppliedFilters = {
  customer_id: '',
  status: '',
  sales_return_id: '',
}

function CreditNoteRowActions({
  row,
  canView,
  canApprove,
  canDelete,
  onView,
  onApprove,
  onDelete,
}: {
  row: CreditNoteRow
  canView: boolean
  canApprove: boolean

  canDelete: boolean
  onView: () => void
  onApprove: () => void

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
            <p>{t('Approve')}</p>
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

export function CreditNotesIndexPage() {
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
    sales_return_id: searchParams.get('sales_return_id') ?? '',
    status: searchParams.get('status') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    customer_id: searchParams.get('customer_id') ?? '',
    sales_return_id: searchParams.get('sales_return_id') ?? '',
    status: searchParams.get('status') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  useAccountPageChrome(t('Manage Credit Notes'), t('Credit Notes'))

  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-credit-notes',
  )
  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-credit-notes',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-credit-notes',
  )
  const canViewSalesReturn = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-sales-return-invoices',
  )

  const metaQuery = useQuery({
    queryKey: ['credit-notes', 'index-meta'],
    queryFn: fetchCreditNotesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.customer_id) params.customer_id = appliedFilters.customer_id
    if (appliedFilters.sales_return_id) params.sales_return_id = appliedFilters.sales_return_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['credit-notes', listParams],
    queryFn: () => listCreditNotesPaginated(listParams),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; credit_note_number?: string } | null>(
    null,
  )

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCreditNote(id),
    onSuccess: () => {
      toast.success(t('Credit note deleted successfully.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete credit note'))),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveCreditNote(id),
    onSuccess: () => {
      toast.success(t('Credit note approved'))
      void queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve credit note'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const customerOptions = useMemo(
    () => toCustomerLookupOptions(metaQuery.data?.customers ?? []),
    [metaQuery.data?.customers],
  )
  const salesReturns = metaQuery.data?.sales_returns ?? []

  const activeFilterCount = [
    appliedFilters.customer_id,
    appliedFilters.status,
    appliedFilters.sales_return_id,
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
    if (filters.sales_return_id) next.set('sales_return_id', filters.sales_return_id)
    else next.delete('sales_return_id')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<CreditNoteRow>[] = [
    {
      key: 'credit_note_number',
      header: t('Credit Note Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(paths.account.creditNotes.show(row.id))}
          >
            {String(value ?? `#${row.id}`)}
          </button>
        ) : (
          String(value ?? `#${row.id}`)
        ),
    },
    {
      key: 'sales_return',
      header: t('Sales Return'),
      render: (_, row) =>
        row.sales_return?.return_number ? (
          canViewSalesReturn ? (
            <Link
              to={paths.sales.returnShow(row.sales_return.id)}
              className="text-primary hover:underline"
            >
              {row.sales_return.return_number}
            </Link>
          ) : (
            row.sales_return.return_number
          )
        ) : (
          '—'
        ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.name ?? '—',
    },
    {
      key: 'credit_note_date',
      header: t('Date'),
      sortable: true,
      render: (value) => (value ? formatDate(String(value)) : '—'),
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
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <CreditNoteStatusBadge status={row.status} />,
    },
    {
      key: 'approved_by',
      header: t('Approved By'),
      render: (_, row) => row.approved_by?.name ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <CreditNoteRowActions
          row={row}
          canView={canView}
          canApprove={canApprove}
          canDelete={
            canDelete &&
            canDeleteCreditNote(row, auth.permissions, auth.roles, auth.user?.type)
          }
          onView={() => navigate(paths.account.creditNotes.show(row.id))}
          onApprove={() => approveMutation.mutate(row.id)}
          onDelete={() =>
            setDeleteTarget({
              id: row.id,
              credit_note_number: row.credit_note_number,
            })
          }
        />
      ),
    },
  ]

  const showActionsColumn = canView || canApprove || canDelete
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Credit notes')}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search by credit note number...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Sales Return')}</Label>
                <Select
                  value={draftFilters.sales_return_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      sales_return_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by sales return')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All sales returns')}</SelectItem>
                    {salesReturns.map((sr) => (
                      <SelectItem key={sr.id} value={String(sr.id)}>
                        {sr.return_number}
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
                    {CREDIT_NOTE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatCreditNoteStatusLabel(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            icon={XCircle}
            title={t('No credit notes found')}
            description={t('Credit notes are automatically created from sales returns.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
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
        title={t('Delete Credit Note')}
        message={
          deleteTarget
            ? creditNoteDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this credit note?')
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
