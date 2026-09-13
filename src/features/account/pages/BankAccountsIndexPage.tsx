import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Edit, Eye, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { BankAccountFormDialog } from '../components/BankAccountFormDialog'
import { BankAccountViewDialog } from '../components/BankAccountViewDialog'
import {
  formatBankAccountType,
  getBankAccountActiveBadgeClasses,
  BANK_ACCOUNT_TYPE_OPTIONS,
} from '../bank-account-utils'
import {
  deleteBankAccount,
  listBankAccountsPaginated,
  type BankAccount,
} from '../bank-accounts-api'

type AppliedFilters = {
  bank_name: string
  account_type: string
  is_active: string
}

const defaultFilters: AppliedFilters = {
  bank_name: '',
  account_type: '',
  is_active: '',
}

type ModalMode = '' | 'create' | 'edit'

export function BankAccountsIndexPage() {
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
    bank_name: searchParams.get('bank_name') ?? '',
    account_type: searchParams.get('account_type') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    bank_name: searchParams.get('bank_name') ?? '',
    account_type: searchParams.get('account_type') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  const [modalMode, setModalMode] = useState<ModalMode>('')
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)

  useAccountPageChrome(t('Manage Bank Accounts'), t('Bank Accounts'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-bank-accounts',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-bank-accounts',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-bank-accounts',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-bank-accounts',
  )

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.bank_name) params.bank_name = appliedFilters.bank_name
    if (appliedFilters.account_type) params.account_type = appliedFilters.account_type
    if (appliedFilters.is_active) params.is_active = appliedFilters.is_active
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['bank-accounts', listParams],
    queryFn: () => listBankAccountsPaginated(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBankAccount(id),
    onSuccess: () => {
      toast.success(t('The bank account has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete bank account'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [
    appliedFilters.bank_name,
    appliedFilters.account_type,
    appliedFilters.is_active,
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
    if (filters.bank_name) next.set('bank_name', filters.bank_name)
    else next.delete('bank_name')
    if (filters.account_type) next.set('account_type', filters.account_type)
    else next.delete('account_type')
    if (filters.is_active) next.set('is_active', filters.is_active)
    else next.delete('is_active')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<BankAccount>[] = [
    {
      key: 'account_number',
      header: t('Account Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setViewingAccount(row)}
          >
            {String(value)}
          </button>
        ) : (
          String(value)
        ),
    },
    {
      key: 'account_name',
      header: t('Account Name'),
      sortable: true,
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'bank_name',
      header: t('Bank Name'),
      sortable: true,
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'account_type',
      header: t('Account Type'),
      render: (value) => formatBankAccountType(String(value), t),
    },
    {
      key: 'current_balance',
      header: t('Current Balance'),
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
    },
    {
      key: 'is_active',
      header: t('Is Active'),
      render: (_, row) => (
        <span className={getBankAccountActiveBadgeClasses(Boolean(row.is_active))}>
          {row.is_active ? t('Active') : t('Inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          {canView ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  onClick={() => setViewingAccount(row)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('View')}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
          {canEdit ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setEditingAccount(row)
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
          {canDelete ? (
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
        </div>
      ),
    },
  ]

  const showActionsColumn = canView || canEdit || canDelete
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Bank accounts')}
        canCreate={canCreate}
        onCreateClick={() => {
          setEditingAccount(null)
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
          searchPlaceholder: t('Search Bank Accounts...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Bank Name')}</Label>
                <Input
                  placeholder={t('Filter by Bank Name')}
                  value={draftFilters.bank_name}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, bank_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Account Type')}</Label>
                <Select
                  value={draftFilters.account_type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      account_type: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by Account Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {BANK_ACCOUNT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Status')}</Label>
                <Select
                  value={draftFilters.is_active || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      is_active: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    <SelectItem value="1">{t('Active')}</SelectItem>
                    <SelectItem value="0">{t('Inactive')}</SelectItem>
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
            icon={CreditCard}
            title={t('No Bank Accounts found')}
            description={t('Get started by creating your first Bank Account.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-bank-accounts"
            onCreateClick={() => {
              setEditingAccount(null)
              setModalMode('create')
            }}
            createButtonText={t('Create Bank Account')}
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

      <BankAccountFormDialog
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingAccount(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        account={editingAccount}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })}
      />

      <BankAccountViewDialog
        open={viewingAccount !== null}
        onOpenChange={(open) => !open && setViewingAccount(null)}
        account={viewingAccount}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Bank Account')}
        message={t('Are you sure you want to delete this bank account?')}
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
