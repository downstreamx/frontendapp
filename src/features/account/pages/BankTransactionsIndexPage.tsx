import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Circle, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
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
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  BANK_TRANSACTION_TYPE_OPTIONS,
  formatBankTransactionStatusLabel,
  formatBankTransactionTypeLabel,
  getBankTransactionStatusBadgeClasses,
  getBankTransactionTypeBadgeClasses,
} from '../bank-transaction-utils'
import {
  getBankTransactionIndexMeta,
  listBankTransactionsPaginated,
  reconcileBankTransaction,
  type BankTransaction,
} from '../bank-transactions-api'

type AppliedFilters = {
  bank_account_id: string
  transaction_type: string
}

const defaultFilters: AppliedFilters = {
  bank_account_id: '',
  transaction_type: '',
}

export function BankTransactionsIndexPage() {
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
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    transaction_type: searchParams.get('transaction_type') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    transaction_type: searchParams.get('transaction_type') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  useAccountPageChrome(t('Manage Bank Transactions'), t('Bank Transactions'))

  const canReconcile = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'reconcile-bank-transactions',
  )

  const metaQuery = useQuery({
    queryKey: ['bank-transactions', 'index-meta'],
    queryFn: getBankTransactionIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.bank_account_id) params.bank_account_id = appliedFilters.bank_account_id
    if (appliedFilters.transaction_type) params.transaction_type = appliedFilters.transaction_type
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['bank-transactions', listParams],
    queryFn: () => listBankTransactionsPaginated(listParams),
  })

  const reconcileMutation = useMutation({
    mutationFn: reconcileBankTransaction,
    onSuccess: () => {
      toast.success(t('Transaction marked as reconciled'))
      void queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to reconcile transaction'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const bankAccounts = metaQuery.data?.bank_accounts ?? []

  const activeFilterCount = [
    appliedFilters.bank_account_id,
    appliedFilters.transaction_type,
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
    if (filters.bank_account_id) next.set('bank_account_id', filters.bank_account_id)
    else next.delete('bank_account_id')
    if (filters.transaction_type) next.set('transaction_type', filters.transaction_type)
    else next.delete('transaction_type')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<BankTransaction>[] = [
    {
      key: 'transaction_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => formatDate(row.transaction_date),
    },
    {
      key: 'bank_account',
      header: t('Bank Account'),
      render: (_, row) => {
        const account = row.bank_account
        if (!account) return '—'
        return account.account_number
          ? `${account.account_name} (${account.account_number})`
          : account.account_name
      },
    },
    {
      key: 'reference_number',
      header: t('Reference'),
      sortable: true,
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'transaction_type',
      header: t('Type'),
      sortable: true,
      render: (_, row) => (
        <span className={getBankTransactionTypeBadgeClasses(row.transaction_type)}>
          {formatBankTransactionTypeLabel(row.transaction_type, t)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('Amount'),
      sortable: true,
      render: (_, row) => formatCurrency(Number(row.amount)),
    },
    {
      key: 'running_balance',
      header: t('Balance'),
      render: (_, row) => formatCurrency(Number(row.running_balance)),
    },
    {
      key: 'description',
      header: t('Description'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'transaction_status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getBankTransactionStatusBadgeClasses(row.transaction_status)}>
          {formatBankTransactionStatusLabel(row.transaction_status, t)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => {
        const isReconciled = row.reconciliation_status === 'reconciled'
        if (isReconciled) {
          return (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="inline-flex h-8 w-8 items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Reconciled')}</p>
              </TooltipContent>
            </Tooltip>
          )
        }
        if (!canReconcile) {
          return <Circle className="h-4 w-4 text-muted-foreground" />
        }
        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                disabled={reconcileMutation.isPending}
                onClick={() => reconcileMutation.mutate(row.id)}
              >
                <Circle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Mark as Reconciled')}</p>
            </TooltipContent>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Bank Transactions')}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search transactions...'),
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
                    <SelectValue placeholder={t('Filter by Bank Account')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All accounts')}</SelectItem>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.account_name}
                        {b.account_number ? ` (${b.account_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Transaction Type')}</Label>
                <Select
                  value={draftFilters.transaction_type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      transaction_type: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {BANK_TRANSACTION_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatBankTransactionTypeLabel(type, t)}
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
            icon={CreditCard}
            title={t('No transactions found')}
            description={t('Bank transactions will appear here once created.')}
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
            columns={columns}
            onSort={setSort}
            sortKey={sortField}
            sortDirection={sortDirection}
          />
        )}
      </ModuleListCard>
    </TooltipProvider>
  )
}
