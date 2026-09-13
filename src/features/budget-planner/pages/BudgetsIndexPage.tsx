import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  budgetPeriodLabel,
  createBudget,
  deleteBudget,
  listBudgetsPaginated,
  updateBudget,
  type BudgetRow,
} from '../budget-planner-api'
import { useBudgetsMeta } from '../hooks/use-budget-planner-meta'

type AppliedFilters = {
  period_id: string
  budget_type: string
  status: string
}

const defaultFilters: AppliedFilters = {
  period_id: '',
  budget_type: '',
  status: '',
}

export function BudgetsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | ''>('')
  const [editRow, setEditRow] = useState<BudgetRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const { meta, periodOptions } = useBudgetsMeta()

  const budgetTypeOptions = useMemo(
    () =>
      (meta?.budget_types ?? ['operating', 'capital', 'project']).map((type) => ({
        value: type,
        label: type === 'cash_flow' ? 'Cash flow' : type.charAt(0).toUpperCase() + type.slice(1),
      })),
    [meta?.budget_types],
  )

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'budget_name', label: t('Budget name'), required: true },
      {
        name: 'period_id',
        label: t('Period'),
        type: 'select',
        required: true,
        options: periodOptions.map((p) => ({ value: String(p.id), label: p.label })),
      },
      {
        name: 'budget_type',
        label: t('Type'),
        type: 'select',
        required: true,
        options: budgetTypeOptions,
      },
      { name: 'total_budget_amount', label: t('Total amount'), type: 'number', required: true },
      { name: 'status', label: t('Status') },
    ],
    [budgetTypeOptions, periodOptions, t],
  )

  usePageChrome({
    pageTitle: t('Budgets'),
    breadcrumbs: [{ label: t('Budget planner') }, { label: t('Budgets') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.period_id) params.period_id = appliedFilters.period_id
    if (appliedFilters.budget_type) params.budget_type = appliedFilters.budget_type
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-planner', 'budgets', listParams],
    queryFn: () => listBudgetsPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budgets'] })

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      toast.success(t('Created successfully'))
      invalidate()
      setModalMode('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create'))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateBudget(id, payload),
    onSuccess: () => {
      toast.success(t('Saved successfully'))
      invalidate()
      setModalMode('')
      setEditRow(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      return next
    })
  }

  const columns: Column<BudgetRow>[] = [
    {
      key: 'budget_name',
      header: t('Budget name'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.budgetPlanner.budgetShow(row.id)} className="font-medium text-primary hover:underline">
          {row.budget_name}
        </Link>
      ),
    },
    {
      key: 'period',
      header: t('Period'),
      render: (_, row) => budgetPeriodLabel(row.budget_period, row.period_id),
    },
    {
      key: 'budget_type',
      header: t('Type'),
      sortable: true,
      render: (_, row) => (
        <span className="capitalize">{row.budget_type?.replace(/_/g, ' ') ?? '—'}</span>
      ),
    },
    {
      key: 'total_budget_amount',
      header: t('Amount'),
      sortable: true,
      render: (_, row) =>
        row.total_budget_amount != null ? formatCurrency(row.total_budget_amount) : '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (row.status ? <FleetStatusBadge status={row.status} /> : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="manage-budgets"
          deletePermission="manage-budgets"
          onEdit={() => navigate(paths.budgetPlanner.budgetEdit(row.id))}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Budgets')}
        description={t('Plan and track operating, capital, and project budgets by period.')}
        canCreate
        onCreateClick={() => navigate(paths.budgetPlanner.budgetCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search budgets...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Period')}</Label>
                <Select
                  value={draftFilters.period_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, period_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All periods')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All periods')}</SelectItem>
                    {(meta?.budget_periods ?? []).map((period) => (
                      <SelectItem key={period.id} value={String(period.id)}>
                        {period.financial_year
                          ? `${period.period_name} (${period.financial_year})`
                          : period.period_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Type')}</Label>
                <Select
                  value={draftFilters.budget_type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, budget_type: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {budgetTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(meta?.statuses ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={pagination}
        onPageChange={(p) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(p))
            return next
          })
        }
      >
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreateClick={() => navigate(paths.budgetPlanner.budgetCreate)}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <CrudFormDialog
        open={modalMode === 'add' || modalMode === 'edit'}
        mode={modalMode === 'edit' ? 'edit' : 'add'}
        title={
          modalMode === 'edit'
            ? t('Edit {{entity}}', { entity: t('Budget') })
            : t('Create {{entity}}', { entity: t('Budget') })
        }
        fields={fields}
        initialValues={
          editRow
            ? {
                ...editRow,
                period_id: editRow.period_id ?? editRow.budget_period?.id,
              }
            : undefined
        }
        isPending={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditRow(null)
          }
        }}
        onSubmit={(raw) => {
          const payload = { ...raw }
          for (const key of Object.keys(payload)) {
            if (key.endsWith('_id') && payload[key] !== '' && payload[key] != null) {
              payload[key] = Number(payload[key])
            }
          }
          if (modalMode === 'edit' && editRow?.id != null) {
            updateMutation.mutate({ id: editRow.id, payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
      />

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete {{entity}}', { entity: t('Budget') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
