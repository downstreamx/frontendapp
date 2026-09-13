import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Edit, Eye, Play, Trash2 } from 'lucide-react'
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
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatCurrency } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { BankTransferFormDialog } from '../components/BankTransferFormDialog'
import { BankTransferViewDialog } from '../components/BankTransferViewDialog'
import {
  BANK_TRANSFER_STATUS_OPTIONS,
  formatBankTransferStatusLabel,
  getBankTransferStatusBadgeClasses,
} from '../bank-transfer-utils'
import {
  deleteBankTransfer,
  getBankTransferCreateMeta,
  listBankTransfersPaginated,
  processBankTransfer,
  type BankTransfer,
} from '../bank-transfers-api'

type AppliedFilters = {
  status: string
  from_account_id: string
  to_account_id: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  from_account_id: '',
  to_account_id: '',
}

type ModalMode = '' | 'create' | 'edit'

export function BankTransfersIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(() => ({
    status: searchParams.get('status') ?? '',
    from_account_id: searchParams.get('from_account_id') ?? '',
    to_account_id: searchParams.get('to_account_id') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    status: searchParams.get('status') ?? '',
    from_account_id: searchParams.get('from_account_id') ?? '',
    to_account_id: searchParams.get('to_account_id') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  const [modalMode, setModalMode] = useState<ModalMode>('')
  const [editingTransfer, setEditingTransfer] = useState<BankTransfer | null>(null)
  const [viewingTransfer, setViewingTransfer] = useState<BankTransfer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BankTransfer | null>(null)
  const [processTarget, setProcessTarget] = useState<BankTransfer | null>(null)

  useAccountPageChrome(t('Manage Bank Transfers'), t('Bank Transfers'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-bank-transfers',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-bank-transfers',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-bank-transfers',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-bank-transfers',
  )
  const canProcess = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'process-bank-transfers',
  )

  const metaQuery = useQuery({
    queryKey: ['bank-transfers', 'create-meta'],
    queryFn: getBankTransferCreateMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.from_account_id) params.from_account_id = appliedFilters.from_account_id
    if (appliedFilters.to_account_id) params.to_account_id = appliedFilters.to_account_id
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['bank-transfers', listParams],
    queryFn: () => listBankTransfersPaginated(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBankTransfer(id),
    onSuccess: () => {
      toast.success(t('The bank transfer has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['bank-transfers'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete bank transfer'))),
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => processBankTransfer(id),
    onSuccess: () => {
      toast.success(t('The bank transfer has been processed successfully.'))
      setProcessTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['bank-transfers'] })
      void queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to process bank transfer'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const bankAccounts = metaQuery.data?.bank_accounts ?? []

  const activeFilterCount = [
    appliedFilters.status,
    appliedFilters.from_account_id,
    appliedFilters.to_account_id,
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
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    if (filters.from_account_id) next.set('from_account_id', filters.from_account_id)
    else next.delete('from_account_id')
    if (filters.to_account_id) next.set('to_account_id', filters.to_account_id)
    else next.delete('to_account_id')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<BankTransfer>[] = [
    {
      key: 'transfer_number',
      header: t('Transfer Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setViewingTransfer(row)}
          >
            {String(value ?? `#${row.id}`)}
          </button>
        ) : (
          String(value ?? `#${row.id}`)
        ),
    },
    {
      key: 'transfer_date',
      header: t('Transfer Date'),
      sortable: true,
      render: (value) => String(value ?? '—').slice(0, 10),
    },
    {
      key: 'from_account',
      header: t('From Account'),
      render: (_, row) => row.from_account?.account_name ?? '—',
    },
    {
      key: 'to_account',
      header: t('To Account'),
      render: (_, row) => row.to_account?.account_name ?? '—',
    },
    {
      key: 'transfer_amount',
      header: t('Amount'),
      sortable: true,
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getBankTransferStatusBadgeClasses(row.status)}>
          {formatBankTransferStatusLabel(row.status, t)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => {
        const isPending = row.status === 'pending'
        return (
          <div className="flex gap-1">
            {canView ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    onClick={() => setViewingTransfer(row)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('View')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {canEdit && isPending ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setEditingTransfer(row)
                      setModalMode('edit')
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Edit')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {canDelete && isPending ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Delete')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {canProcess && isPending ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-primary hover:text-primary"
                    onClick={() => setProcessTarget(row)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Process')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )
      },
    },
  ]

  const showActionsColumn = canView || canEdit || canDelete || canProcess
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Bank Transfers')}
        canCreate={canCreate}
        onCreateClick={() => {
          setEditingTransfer(null)
          setModalMode('create')
        }}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search transfers...'),
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
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {BANK_TRANSFER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatBankTransferStatusLabel(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('From Account')}</Label>
                <Select
                  value={draftFilters.from_account_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      from_account_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by source account')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All accounts')}</SelectItem>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('To Account')}</Label>
                <Select
                  value={draftFilters.to_account_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      to_account_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by destination account')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All accounts')}</SelectItem>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ),
        }}
        pagination={pagination ? { ...pagination, onPageChange: goToPage } : undefined}
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={ArrowLeftRight}
            title={t('No Bank Transfers found')}
            description={t('Get started by creating your first bank transfer.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-bank-transfers"
            onCreateClick={() => {
              setEditingTransfer(null)
              setModalMode('create')
            }}
            createButtonText={t('Create Bank Transfer')}
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

      <BankTransferFormDialog
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingTransfer(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        transfer={editingTransfer}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['bank-transfers'] })}
      />

      <BankTransferViewDialog
        open={viewingTransfer !== null}
        onOpenChange={(open) => !open && setViewingTransfer(null)}
        transfer={viewingTransfer}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Bank Transfer')}
        message={t('Are you sure you want to delete this bank transfer?')}
        confirmText={t('Delete')}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        open={processTarget !== null}
        onOpenChange={(open) => !open && setProcessTarget(null)}
        title={t('Process Bank Transfer')}
        message={t('Are you sure you want to process this bank transfer? This will move funds between accounts.')}
        confirmText={t('Process')}
        onConfirm={() => {
          if (processTarget) processMutation.mutate(processTarget.id)
        }}
        loading={processMutation.isPending}
      />
    </TooltipProvider>
  )
}
