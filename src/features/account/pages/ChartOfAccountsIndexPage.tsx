import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Edit, Eye, Trash2 } from 'lucide-react'
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
import { ChartOfAccountFormDialog } from '../components/ChartOfAccountFormDialog'
import { ChartOfAccountViewDialog } from '../components/ChartOfAccountViewDialog'
import {
  formatChartOfAccountNormalBalanceLabel,
  getAccountNameIndent,
  getChartOfAccountActiveBadgeClasses,
  getChartOfAccountNormalBalanceBadgeClasses,
} from '../chart-of-account-utils'
import {
  deleteChartOfAccount,
  getChartOfAccountIndexMeta,
  listChartOfAccountsPaginated,
  type ChartOfAccount,
} from '../chart-of-accounts-api'

type AppliedFilters = {
  account_type_id: string
  normal_balance: string
  is_active: string
}

const defaultFilters: AppliedFilters = {
  account_type_id: '',
  normal_balance: '',
  is_active: '',
}

type ModalMode = '' | 'create' | 'edit'

export function ChartOfAccountsIndexPage() {
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
    account_type_id: searchParams.get('account_type_id') ?? '',
    normal_balance: searchParams.get('normal_balance') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    account_type_id: searchParams.get('account_type_id') ?? '',
    normal_balance: searchParams.get('normal_balance') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  const [modalMode, setModalMode] = useState<ModalMode>('')
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [viewingAccount, setViewingAccount] = useState<ChartOfAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChartOfAccount | null>(null)

  useAccountPageChrome(t('Manage Chart Of Accounts'), t('Chart Of Accounts'))

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-chart-of-accounts',
  )
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-chart-of-accounts',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-chart-of-accounts',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-chart-of-accounts',
  )

  const metaQuery = useQuery({
    queryKey: ['chart-of-accounts', 'index-meta'],
    queryFn: getChartOfAccountIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.account_type_id) params.account_type_id = appliedFilters.account_type_id
    if (appliedFilters.normal_balance) params.normal_balance = appliedFilters.normal_balance
    if (appliedFilters.is_active) params.is_active = appliedFilters.is_active
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['chart-of-accounts', listParams],
    queryFn: () => listChartOfAccountsPaginated(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChartOfAccount(id),
    onSuccess: () => {
      toast.success(t('Chart of account deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to delete chart of account'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const accountTypes = metaQuery.data?.account_types ?? []

  const activeFilterCount = [
    appliedFilters.account_type_id,
    appliedFilters.normal_balance,
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
    if (filters.account_type_id) next.set('account_type_id', filters.account_type_id)
    else next.delete('account_type_id')
    if (filters.normal_balance) next.set('normal_balance', filters.normal_balance)
    else next.delete('normal_balance')
    if (filters.is_active) next.set('is_active', filters.is_active)
    else next.delete('is_active')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<ChartOfAccount>[] = [
    {
      key: 'account_code',
      header: t('Account Code'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="font-mono text-primary hover:underline"
            onClick={() => setViewingAccount(row)}
          >
            {String(value)}
          </button>
        ) : (
          <span className="font-mono">{String(value)}</span>
        ),
    },
    {
      key: 'account_name',
      header: t('Account Name'),
      sortable: true,
      render: (_, row) => (
        <span style={{ paddingLeft: getAccountNameIndent(row.level) }}>{row.account_name}</span>
      ),
    },
    {
      key: 'account_type',
      header: t('Account Type'),
      render: (_, row) => row.account_type?.name ?? '—',
    },
    {
      key: 'parent_account',
      header: t('Parent Account'),
      render: (_, row) => row.parent_account?.account_name ?? '—',
    },
    {
      key: 'normal_balance',
      header: t('Normal Balance'),
      sortable: true,
      render: (_, row) => (
        <span className={getChartOfAccountNormalBalanceBadgeClasses(row.normal_balance)}>
          {formatChartOfAccountNormalBalanceLabel(row.normal_balance, t)}
        </span>
      ),
    },
    {
      key: 'opening_balance',
      header: t('Opening Balance'),
      render: (_, row) =>
        row.opening_balance != null ? formatCurrency(Number(row.opening_balance)) : '—',
    },
    {
      key: 'current_balance',
      header: t('Current Balance'),
      sortable: true,
      render: (_, row) => formatCurrency(Number(row.current_balance ?? 0)),
    },
    {
      key: 'is_active',
      header: t('Status'),
      render: (_, row) => (
        <span className={getChartOfAccountActiveBadgeClasses(Boolean(row.is_active))}>
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
          {canDelete && !row.is_system_account ? (
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
        title={t('Chart Of Accounts')}
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
          searchPlaceholder: t('Search Chart Of Accounts...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Account Type')}</Label>
                <Select
                  value={draftFilters.account_type_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      account_type_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All Account Types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Account Types')}</SelectItem>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Normal Balance')}</Label>
                <Select
                  value={draftFilters.normal_balance || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      normal_balance: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All Normal Balance')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Normal Balance')}</SelectItem>
                    <SelectItem value="debit">{t('Debit')}</SelectItem>
                    <SelectItem value="credit">{t('Credit')}</SelectItem>
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
                    <SelectValue placeholder={t('All Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Status')}</SelectItem>
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
            icon={Calculator}
            title={t('No Chart Of Accounts found')}
            description={t('Get started by creating your first Chart Of Account.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-chart-of-accounts"
            onCreateClick={() => {
              setEditingAccount(null)
              setModalMode('create')
            }}
            createButtonText={t('Create Chart Of Account')}
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

      <ChartOfAccountFormDialog
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingAccount(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        account={editingAccount}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })}
      />

      <ChartOfAccountViewDialog
        open={viewingAccount !== null}
        onOpenChange={(open) => !open && setViewingAccount(null)}
        account={viewingAccount}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Chart Of Account')}
        message={t('Are you sure you want to delete this chart of account?')}
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
