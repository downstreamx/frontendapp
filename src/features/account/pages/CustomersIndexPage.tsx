import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, FileText, Lock, Trash2, Users } from 'lucide-react'
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
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { canDeleteCustomer, customerDeleteMessage } from '../customer-delete'
import { getApiErrorMessage } from '@/lib/errors'
import { listCustomersPaginated, type PartyRow } from '../account-party-api'
import { PartyCompanyNameCell } from '../components/PartyCompanyNameCell'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { PartyCreateDialog } from '../components/PartyCreateDialog'
import { formatCurrency } from '@/utils/helpers'

type AppliedFilters = {
  company_name: string
  customer_code: string
  tax_number: string
}

const defaultFilters: AppliedFilters = {
  company_name: '',
  customer_code: '',
  tax_number: '',
}

function CustomerRowActions({
  row,
  canViewReport,
  canView,
  canEdit,
  canDelete,
  onViewReport,
  onView,
  onEdit,
  onDelete,
}: {
  row: PartyRow
  canViewReport: boolean
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  onViewReport: () => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()

  if (row.user?.is_disable) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('User is disabled')}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="flex gap-1">
      {canViewReport && row.id ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
              onClick={onViewReport}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('View Report')}</p>
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
      {canEdit ? (
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
      {canDelete ? (
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

export function CustomersIndexPage() {
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
    company_name: searchParams.get('company_name') ?? '',
    customer_code: searchParams.get('customer_code') ?? '',
    tax_number: searchParams.get('tax_number') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    company_name: searchParams.get('company_name') ?? '',
    customer_code: searchParams.get('customer_code') ?? '',
    tax_number: searchParams.get('tax_number') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useAccountPageChrome(t('Manage Customers'), t('Customers'))

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-customers')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-customers')
  const mayDeleteCustomers = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-customers',
  )
  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-customers')
  const canViewReport = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-customer-detail-report',
  )

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.company_name) params.company_name = appliedFilters.company_name
    if (appliedFilters.customer_code) params.customer_code = appliedFilters.customer_code
    if (appliedFilters.tax_number) params.tax_number = appliedFilters.tax_number
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['account', 'customers', listParams],
    queryFn: () => listCustomersPaginated(listParams),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'account.customers.destroy',
      defaultMessage: t('Are you sure you want to delete this customer?'),
      onSuccess: () => {
        toast.success(t('The customer has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['account', 'customers'] })
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, t('Failed to delete customer'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [
    appliedFilters.company_name,
    appliedFilters.customer_code,
    appliedFilters.tax_number,
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
    if (filters.company_name) next.set('company_name', filters.company_name)
    else next.delete('company_name')
    if (filters.customer_code) next.set('customer_code', filters.customer_code)
    else next.delete('customer_code')
    if (filters.tax_number) next.set('tax_number', filters.tax_number)
    else next.delete('tax_number')
    next.set('page', '1')
    setSearchParams(next)
  }

  const openReport = (row: PartyRow) => {
    if (!row.id) return
    const params = new URLSearchParams({ customer_id: String(row.id) })
    navigate(`${paths.account.reports}?${params.toString()}`)
  }

  const columns: Column<PartyRow>[] = [
    {
      key: 'user',
      header: t('User'),
      render: (_, row) => {
        if (!row.user) return '—'
        return <TableUserAvatarCell avatar={row.user.avatar} name={row.user.name} size="sm" />
      },
    },
    { key: 'customer_code', header: t('Customer Code'), sortable: true },
    {
      key: 'company_name',
      header: t('Company Name'),
      sortable: true,
      render: (_, row) => (
        <PartyCompanyNameCell companyName={row.company_name} companyLogo={row.company_logo} />
      ),
    },
    { key: 'contact_person_name', header: t('Contact Person'), sortable: true },
    {
      key: 'credit_limit',
      header: t('Credit limit'),
      render: (_, row) =>
        row.credit_limit != null ? (
          <span className="font-medium">{formatCurrency(row.credit_limit)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'available_credit_limit',
      header: t('Available limit'),
      render: (_, row) =>
        row.available_credit_limit != null ? (
          <span className="font-medium">{formatCurrency(row.available_credit_limit)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'balance',
      header: t('Balance'),
      render: (_, row) =>
        row.balance ? (
          <span className="font-medium">{formatCurrency(row.balance.outstanding_balance)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <CustomerRowActions
          row={row}
          canViewReport={canViewReport}
          canView={canView}
          canEdit={canEdit}
          canDelete={mayDeleteCustomers && canDeleteCustomer(row, auth.permissions, auth.roles, auth.user?.type)}
          onViewReport={() => openReport(row)}
          onView={() => navigate(paths.account.customerShow(row.id))}
          onEdit={() => navigate(paths.account.customerEdit(row.id))}
          onDelete={() => openDeleteDialog(row.id, customerDeleteMessage(row, t))}
        />
      ),
    },
  ]

  const showActionsColumn = canView || canEdit || mayDeleteCustomers || canViewReport
  const visibleColumns = showActionsColumn
    ? columns
    : columns.filter((column) => column.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Customers')}
        canCreate={canCreate}
        onCreateClick={() => setCreateDialogOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search customers...'),
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
                <Label className="mb-2 block text-sm font-medium">{t('Company Name')}</Label>
                <Input
                  value={draftFilters.company_name}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, company_name: e.target.value }))
                  }
                  placeholder={t('Filter by company name')}
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Customer Code')}</Label>
                <Input
                  value={draftFilters.customer_code}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, customer_code: e.target.value }))
                  }
                  placeholder={t('Filter by customer code')}
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Tax Number')}</Label>
                <Input
                  value={draftFilters.tax_number}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, tax_number: e.target.value }))
                  }
                  placeholder={t('Filter by tax number')}
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
            icon={Users}
            title={t('No customers found')}
            description={t('Get started by creating your first customer.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-customers"
            onCreateClick={() => setCreateDialogOpen(true)}
            createButtonText={t('Create customer')}
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

      <PartyCreateDialog
        party="customer"
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Customer')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </TooltipProvider>
  )
}
