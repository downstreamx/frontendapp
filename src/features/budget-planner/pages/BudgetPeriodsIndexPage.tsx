import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
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
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  createBudgetPeriod,
  deleteBudgetPeriod,
  listBudgetPeriodsPaginated,
  updateBudgetPeriod,
  type BudgetPeriodRow,
} from '../budget-planner-api'
import { useBudgetPeriodsMeta } from '../hooks/use-budget-planner-meta'

type AppliedFilters = {
  financial_year: string
  status: string
  start_date_from: string
  start_date_to: string
}

const defaultFilters: AppliedFilters = {
  financial_year: '',
  status: '',
  start_date_from: '',
  start_date_to: '',
}

const periodFields: CrudFieldDef[] = [
  { name: 'period_name', label: 'Period name', required: true },
  { name: 'financial_year', label: 'Financial year', required: true },
  { name: 'start_date', label: 'Start date', type: 'date' },
  { name: 'end_date', label: 'End date', type: 'date' },
  { name: 'status', label: 'Status' },
]

export function BudgetPeriodsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | ''>('')
  const [editRow, setEditRow] = useState<BudgetPeriodRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Budget periods'),
    breadcrumbs: [{ label: t('Budget planner') }, { label: t('Budget periods') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.financial_year) params.financial_year = appliedFilters.financial_year
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.start_date_from) params.start_date_from = appliedFilters.start_date_from
    if (appliedFilters.start_date_to) params.start_date_to = appliedFilters.start_date_to
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-planner', 'budget-periods', listParams],
    queryFn: () => listBudgetPeriodsPaginated(listParams),
  })

  const { meta } = useBudgetPeriodsMeta()

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budget-periods'] })

  const createMutation = useMutation({
    mutationFn: createBudgetPeriod,
    onSuccess: () => {
      toast.success(t('Created successfully'))
      invalidate()
      setModalMode('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create'))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateBudgetPeriod(id, payload),
    onSuccess: () => {
      toast.success(t('Saved successfully'))
      invalidate()
      setModalMode('')
      setEditRow(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetPeriod,
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

  const columns: Column<BudgetPeriodRow>[] = [
    {
      key: 'period_name',
      header: t('Period name'),
      sortable: true,
      render: (_, row) => row.period_name,
    },
    {
      key: 'financial_year',
      header: t('Financial year'),
      sortable: true,
      render: (_, row) => row.financial_year ?? '—',
    },
    {
      key: 'start_date',
      header: t('Start date'),
      sortable: true,
      render: (_, row) => (row.start_date ? formatDate(row.start_date) : '—'),
    },
    {
      key: 'end_date',
      header: t('End date'),
      sortable: true,
      render: (_, row) => (row.end_date ? formatDate(row.end_date) : '—'),
    },
    {
      key: 'budgets_count',
      header: t('Budgets'),
      render: (_, row) => String(row.budgets_count ?? 0),
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
          editPermission="manage-budget-periods"
          deletePermission="manage-budget-periods"
          onEdit={() => {
            setEditRow(row)
            setModalMode('edit')
          }}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Budget periods')}
        description={t('Define financial periods used to group and track budgets.')}
        canCreate
        onCreateClick={() => navigate(paths.budgetPlanner.periodCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search periods...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>{t('Financial year')}</Label>
                <Select
                  value={draftFilters.financial_year || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, financial_year: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All years')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All years')}</SelectItem>
                    {(meta?.financial_years ?? []).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
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
              <div className="space-y-1">
                <Label>{t('Start from')}</Label>
                <Input
                  type="date"
                  value={draftFilters.start_date_from}
                  onChange={(e) =>
                    setDraftFilters((f) => ({ ...f, start_date_from: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Start to')}</Label>
                <Input
                  type="date"
                  value={draftFilters.start_date_to}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, start_date_to: e.target.value }))}
                />
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
            onCreateClick={() => navigate(paths.budgetPlanner.periodCreate)}
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
            ? t('Edit {{entity}}', { entity: t('Budget period') })
            : t('Create {{entity}}', { entity: t('Budget period') })
        }
        fields={periodFields}
        initialValues={editRow ?? undefined}
        isPending={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditRow(null)
          }
        }}
        onSubmit={(raw) => {
          const payload = { ...raw }
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
        title={t('Delete {{entity}}', { entity: t('Budget period') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
