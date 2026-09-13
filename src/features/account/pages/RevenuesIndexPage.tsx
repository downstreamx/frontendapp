import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, DollarSign, Edit, Eye, Play, Trash2 } from 'lucide-react'
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
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { RevenueFormDialog } from '../components/RevenueFormDialog'
import { RevenueViewDialog } from '../components/RevenueViewDialog'
import {
  REVENUE_STATUS_OPTIONS,
  formatRevenueStatusLabel,
  getRevenueStatusBadgeClasses,
} from '../revenue-utils'
import {
  approveRevenue,
  deleteRevenue,
  getRevenueIndexMeta,
  listRevenuesPaginated,
  postRevenue,
  type Revenue,
} from '../revenues-api'

type AppliedFilters = {
  category_id: string
  bank_account_id: string
  status: string
  date_from: string
  date_to: string
}

const defaultFilters: AppliedFilters = {
  category_id: '',
  bank_account_id: '',
  status: '',
  date_from: '',
  date_to: '',
}

type ModalMode = '' | 'create' | 'edit'

export function RevenuesIndexPage() {
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
    category_id: searchParams.get('category_id') ?? '',
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_from: searchParams.get('date_from') ?? '',
    date_to: searchParams.get('date_to') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    category_id: searchParams.get('category_id') ?? '',
    bank_account_id: searchParams.get('bank_account_id') ?? '',
    status: searchParams.get('status') ?? '',
    date_from: searchParams.get('date_from') ?? '',
    date_to: searchParams.get('date_to') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  const [modalMode, setModalMode] = useState<ModalMode>('')
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null)
  const [viewingRevenue, setViewingRevenue] = useState<Revenue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Revenue | null>(null)
  const [approveTarget, setApproveTarget] = useState<Revenue | null>(null)
  const [postTarget, setPostTarget] = useState<Revenue | null>(null)

  useAccountPageChrome(t('Manage Revenues'), t('Revenues'))

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-revenues')
  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-revenues')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-revenues')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-revenues')
  const canApprove = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'approve-revenues')
  const canPost = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'post-revenues')

  const metaQuery = useQuery({
    queryKey: ['revenues', 'index-meta'],
    queryFn: getRevenueIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.category_id) params.category_id = appliedFilters.category_id
    if (appliedFilters.bank_account_id) params.bank_account_id = appliedFilters.bank_account_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.date_from) params.date_from = appliedFilters.date_from
    if (appliedFilters.date_to) params.date_to = appliedFilters.date_to
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['revenues', listParams],
    queryFn: () => listRevenuesPaginated(listParams),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['revenues'] })
    void queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteRevenue,
    onSuccess: () => {
      toast.success(t('The revenue has been deleted.'))
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete revenue'))),
  })

  const approveMutation = useMutation({
    mutationFn: approveRevenue,
    onSuccess: () => {
      toast.success(t('Revenue approved successfully.'))
      setApproveTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve revenue'))),
  })

  const postMutation = useMutation({
    mutationFn: postRevenue,
    onSuccess: () => {
      toast.success(t('Revenue posted successfully.'))
      setPostTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post revenue'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const categories = metaQuery.data?.categories ?? []
  const bankAccounts = metaQuery.data?.bank_accounts ?? []

  const activeFilterCount = [
    appliedFilters.category_id,
    appliedFilters.bank_account_id,
    appliedFilters.status,
    appliedFilters.date_from,
    appliedFilters.date_to,
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
    if (filters.category_id) next.set('category_id', filters.category_id)
    else next.delete('category_id')
    if (filters.bank_account_id) next.set('bank_account_id', filters.bank_account_id)
    else next.delete('bank_account_id')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    if (filters.date_from) next.set('date_from', filters.date_from)
    else next.delete('date_from')
    if (filters.date_to) next.set('date_to', filters.date_to)
    else next.delete('date_to')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<Revenue>[] = [
    {
      key: 'revenue_number',
      header: t('Revenue Number'),
      sortable: true,
      render: (value, row) =>
        canView ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setViewingRevenue(row)}
          >
            {String(value ?? `#${row.id}`)}
          </button>
        ) : (
          String(value ?? `#${row.id}`)
        ),
    },
    {
      key: 'revenue_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => formatDate(row.revenue_date),
    },
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.category?.category_name ?? '—',
    },
    {
      key: 'bank_account',
      header: t('Bank Account'),
      render: (_, row) => row.bank_account?.account_name ?? '—',
    },
    {
      key: 'chart_of_account',
      header: t('Chart of Account'),
      render: (_, row) =>
        row.chart_of_account
          ? `${row.chart_of_account.account_code} — ${row.chart_of_account.account_name}`
          : '—',
    },
    {
      key: 'amount',
      header: t('Amount'),
      sortable: true,
      render: (_, row) => formatCurrency(Number(row.amount)),
    },
    {
      key: 'reference_number',
      header: t('Reference'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getRevenueStatusBadgeClasses(row.status)}>
          {formatRevenueStatusLabel(row.status, t)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          {row.status === 'draft' && canApprove ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                  onClick={() => setApproveTarget(row)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Approve')}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
          {row.status === 'approved' && canPost ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  onClick={() => setPostTarget(row)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Post')}</p>
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
                  onClick={() => setViewingRevenue(row)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('View')}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
          {row.status === 'draft' && canEdit ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setEditingRevenue(row)
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
          {row.status === 'draft' && canDelete ? (
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

  const showActionsColumn =
    canView || canEdit || canDelete || canApprove || canPost
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Revenues')}
        canCreate={canCreate}
        onCreateClick={() => {
          setEditingRevenue(null)
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
          searchPlaceholder: t('Search revenues...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Category')}</Label>
                <Select
                  value={draftFilters.category_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      category_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All categories')}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
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
                    <SelectValue placeholder={t('Filter by bank account')} />
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
                    {REVENUE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatRevenueStatusLabel(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Date from')}</Label>
                <Input
                  type="date"
                  value={draftFilters.date_from}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, date_from: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Date to')}</Label>
                <Input
                  type="date"
                  value={draftFilters.date_to}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, date_to: e.target.value }))
                  }
                />
              </div>
            </>
          ),
        }}
        pagination={pagination ? { ...pagination, onPageChange: goToPage } : undefined}
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={DollarSign}
            title={t('No revenues found')}
            description={t('Get started by creating your first revenue.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-revenues"
            onCreateClick={() => {
              setEditingRevenue(null)
              setModalMode('create')
            }}
            createButtonText={t('Create Revenue')}
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

      <RevenueFormDialog
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingRevenue(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        revenue={editingRevenue}
        onSuccess={invalidate}
      />

      <RevenueViewDialog
        open={viewingRevenue !== null}
        onOpenChange={(open) => !open && setViewingRevenue(null)}
        revenue={viewingRevenue}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Revenue')}
        message={t('Are you sure you want to delete this revenue?')}
        confirmText={t('Delete')}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={t('Approve Revenue')}
        message={t('Are you sure you want to approve this revenue?')}
        confirmText={t('Approve')}
        onConfirm={() => {
          if (approveTarget) approveMutation.mutate(approveTarget.id)
        }}
        loading={approveMutation.isPending}
      />

      <ConfirmationDialog
        open={postTarget !== null}
        onOpenChange={(open) => !open && setPostTarget(null)}
        title={t('Post Revenue')}
        message={t('Are you sure you want to post this revenue? This will create ledger entries.')}
        confirmText={t('Post')}
        onConfirm={() => {
          if (postTarget) postMutation.mutate(postTarget.id)
        }}
        loading={postMutation.isPending}
      />
    </TooltipProvider>
  )
}
