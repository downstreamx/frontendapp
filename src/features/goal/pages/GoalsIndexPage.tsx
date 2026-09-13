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
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { deleteGoal, listGoalsPaginated, type GoalRow } from '../goal-api'
import { useGoalsIndexMeta } from '../hooks/use-goal-meta'

type AppliedFilters = {
  category_id: string
  goal_type: string
  status: string
  priority: string
}

const defaultFilters: AppliedFilters = {
  category_id: '',
  goal_type: '',
  status: '',
  priority: '',
}

export function GoalsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { meta } = useGoalsIndexMeta()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Goals'),
    breadcrumbs: [{ label: t('Goal') }, { label: t('Goals') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.category_id) params.category_id = appliedFilters.category_id
    if (appliedFilters.goal_type) params.goal_type = appliedFilters.goal_type
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.priority) params.priority = appliedFilters.priority
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['goal', 'goals', listParams],
    queryFn: () => listGoalsPaginated(listParams),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['goal', 'goals'] })

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
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

  const columns: Column<GoalRow>[] = [
    {
      key: 'goal_name',
      header: t('Goal'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.goal.show(row.id)} className="font-medium text-primary hover:underline">
          {row.goal_name}
        </Link>
      ),
    },
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.category?.category_name ?? '—',
    },
    {
      key: 'goal_type',
      header: t('Type'),
      sortable: true,
      render: (_, row) => (
        <span className="capitalize">{row.goal_type?.replace(/_/g, ' ') ?? '—'}</span>
      ),
    },
    {
      key: 'target_amount',
      header: t('Target'),
      sortable: true,
      render: (_, row) =>
        row.target_amount != null ? formatCurrency(row.target_amount) : '—',
    },
    {
      key: 'target_date',
      header: t('Due'),
      sortable: true,
      render: (_, row) => (row.target_date ? formatDate(row.target_date) : '—'),
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
          editPermission="manage-goal"
          deletePermission="manage-goal"
          onEdit={() => navigate(paths.goal.edit(row.id))}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Goals')}
        description={t('Set savings, revenue, and expense targets by category.')}
        canCreate
        onCreateClick={() => navigate(paths.goal.create)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search goals...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>{t('Category')}</Label>
                <Select
                  value={draftFilters.category_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, category_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All categories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All categories')}</SelectItem>
                    {(meta?.goal_categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Type')}</Label>
                <Select
                  value={draftFilters.goal_type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, goal_type: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {(meta?.goal_types ?? []).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
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
                <Label>{t('Priority')}</Label>
                <Select
                  value={draftFilters.priority || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, priority: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All priorities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All priorities')}</SelectItem>
                    {(meta?.priorities ?? []).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
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
            onCreateClick={() => navigate(paths.goal.create)}
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

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete {{entity}}', { entity: t('Goal') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
