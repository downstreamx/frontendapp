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
import { toSupplierLookupOptions } from '@/features/_shared/operations-lookups'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { DebitNoteStatusBadge } from '../components/DebitNoteStatusBadge'
import {
  DEBIT_NOTE_STATUS_OPTIONS,
  formatDebitNoteStatusLabel,
} from '../debit-note-utils'
import { canDeleteDebitNote, debitNoteDeleteMessage } from '../debit-note-delete'
import {
  approveDebitNote,
  deleteDebitNote,
  fetchDebitNotesIndexMeta,
  listDebitNotesPaginated,
  type DebitNoteRow,
} from '../notes-api'

type AppliedFilters = {
  supplier_id: string
  status: string
  purchase_return_id: string
}

const defaultFilters: AppliedFilters = {
  supplier_id: '',
  status: '',
  purchase_return_id: '',
}

function DebitNoteRowActions({
  row,
  canView,
  canApprove,
  canDelete,
  onView,
  onApprove,
  onDelete,
}: {
  row: DebitNoteRow
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

export function DebitNotesIndexPage() {
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
    purchase_return_id: searchParams.get('purchase_return_id') ?? '',
    status: searchParams.get('status') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    supplier_id: searchParams.get('supplier_id') ?? '',
    purchase_return_id: searchParams.get('purchase_return_id') ?? '',
    status: searchParams.get('status') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  useAccountPageChrome(t('Manage Debit Notes'), t('Debit Notes'))

  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-debit-notes',
  )
  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-debit-notes',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-debit-notes',
  )
  const canViewPurchaseReturn = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-purchase-return-invoices',
  )

  const metaQuery = useQuery({
    queryKey: ['debit-notes', 'index-meta'],
    queryFn: fetchDebitNotesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.supplier_id) params.supplier_id = appliedFilters.supplier_id
    if (appliedFilters.purchase_return_id) params.purchase_return_id = appliedFilters.purchase_return_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['debit-notes', listParams],
    queryFn: () => listDebitNotesPaginated(listParams),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; debit_note_number?: string } | null>(
    null,
  )

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDebitNote(id),
    onSuccess: () => {
      toast.success(t('Debit note deleted successfully.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['debit-notes'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete debit note'))),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveDebitNote(id),
    onSuccess: () => {
      toast.success(t('Debit note approved'))
      void queryClient.invalidateQueries({ queryKey: ['debit-notes'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve debit note'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const supplierOptions = useMemo(
    () => toSupplierLookupOptions(metaQuery.data?.suppliers ?? []),
    [metaQuery.data?.suppliers],
  )
  const purchaseReturns = metaQuery.data?.purchase_returns ?? []

  const activeFilterCount = [
    appliedFilters.supplier_id,
    appliedFilters.status,
    appliedFilters.purchase_return_id,
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
    if (filters.purchase_return_id) next.set('purchase_return_id', filters.purchase_return_id)
    else next.delete('purchase_return_id')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<DebitNoteRow>[] = [
    {
      key: 'debit_note_number',
      header: t('Debit Note Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(paths.account.debitNotes.show(row.id))}
          >
            {String(value ?? `#${row.id}`)}
          </button>
        ) : (
          String(value ?? `#${row.id}`)
        ),
    },
    {
      key: 'purchase_return',
      header: t('Purchase Return'),
      render: (_, row) =>
        row.purchase_return?.return_number ? (
          canViewPurchaseReturn ? (
            <Link
              to={paths.purchase.returnShow(row.purchase_return.id)}
              className="text-primary hover:underline"
            >
              {row.purchase_return.return_number}
            </Link>
          ) : (
            row.purchase_return.return_number
          )
        ) : (
          '—'
        ),
    },
    {
      key: 'supplier',
      header: t('Supplier'),
      render: (_, row) => row.supplier?.name ?? '—',
    },
    {
      key: 'debit_note_date',
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
      render: (_, row) => <DebitNoteStatusBadge status={row.status} />,
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
        <DebitNoteRowActions
          row={row}
          canView={canView}
          canApprove={canApprove}
          canDelete={
            canDelete &&
            canDeleteDebitNote(row, auth.permissions, auth.roles, auth.user?.type)
          }
          onView={() => navigate(paths.account.debitNotes.show(row.id))}
          onApprove={() => approveMutation.mutate(row.id)}
          onDelete={() =>
            setDeleteTarget({
              id: row.id,
              debit_note_number: row.debit_note_number,
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
        title={t('Debit notes')}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search by debit note number...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Purchase Return')}</Label>
                <Select
                  value={draftFilters.purchase_return_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      purchase_return_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by purchase return')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All purchase returns')}</SelectItem>
                    {purchaseReturns.map((sr) => (
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
                    {DEBIT_NOTE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatDebitNoteStatusLabel(status, t)}
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
            title={t('No debit notes found')}
            description={t('Debit notes are automatically created from purchase returns.')}
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
        title={t('Delete Debit Note')}
        message={
          deleteTarget
            ? debitNoteDeleteMessage(deleteTarget, t)
            : t('Are you sure you want to delete this debit note?')
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
