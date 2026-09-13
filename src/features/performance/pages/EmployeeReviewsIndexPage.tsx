import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
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
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { personName } from '@/features/shared/lib/entity-labels'
import { deleteEmployeeReview, listEmployeeReviewsPaginated, type EmployeeReviewRow } from '../performance-api'
import { useEmployeeReviewsIndexMeta } from '../hooks/use-performance-meta'

type AppliedFilters = { user_id: string; review_cycle_id: string; status: string }
const defaultFilters: AppliedFilters = { user_id: '', review_cycle_id: '', status: '' }

export function EmployeeReviewsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const canConduct = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'conduct-employee-reviews',
  )
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { meta } = useEmployeeReviewsIndexMeta()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Employee Reviews'),
    breadcrumbs: [{ label: t('Performance') }, { label: t('Employee Reviews') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.user_id) params.user_id = appliedFilters.user_id
    if (appliedFilters.review_cycle_id) params.review_cycle_id = appliedFilters.review_cycle_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['performance', 'employee-reviews', listParams],
    queryFn: () => listEmployeeReviewsPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['performance', 'employee-reviews'] })

  const deleteMutation = useMutation({
    mutationFn: deleteEmployeeReview,
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

  const columns: Column<EmployeeReviewRow>[] = [
    {
      key: 'user',
      header: t('Employee'),
      render: (_, row) => (
        <Link
          to={paths.performance.employeeReviewShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {personName(row.user ?? undefined, row.user_id)}
        </Link>
      ),
    },
    {
      key: 'reviewer',
      header: t('Reviewer'),
      render: (_, row) => personName(row.reviewer ?? undefined, row.reviewer_id),
    },
    {
      key: 'review_cycle',
      header: t('Cycle'),
      render: (_, row) => row.review_cycle?.name ?? '—',
    },
    {
      key: 'review_date',
      header: t('Review date'),
      sortable: true,
      render: (_, row) => (row.review_date ? formatDate(row.review_date) : '—'),
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
        <div className="flex gap-1">
          {canConduct && row.status !== 'completed' ? (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                    onClick={() => navigate(paths.performance.employeeReviewConduct(row.id))}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Conduct review')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          <TableRowActions
            viewPermission="view-employee-reviews"
            editPermission="manage-employee-reviews"
            deletePermission="manage-employee-reviews"
            onView={() => navigate(paths.performance.employeeReviewShow(row.id))}
            onEdit={() => navigate(paths.performance.employeeReviewEdit(row.id))}
            onDelete={() => setDeleteId(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Employee Reviews')}
        description={t('Schedule and track employee performance reviews.')}
        canCreate
        onCreateClick={() => navigate(paths.performance.employeeReviewCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search employee reviews...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Employee')}</Label>
                <Select
                  value={draftFilters.user_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, user_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All employees')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All employees')}</SelectItem>
                    {(meta?.employees ?? []).map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Review cycle')}</Label>
                <Select
                  value={draftFilters.review_cycle_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({
                      ...f,
                      review_cycle_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All cycles')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All cycles')}</SelectItem>
                    {(meta?.review_cycles ?? []).map((cycle) => (
                      <SelectItem key={cycle.id} value={String(cycle.id)}>
                        {cycle.name}
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
            onCreateClick={() => navigate(paths.performance.employeeReviewCreate)}
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
        title={t('Delete {{entity}}', { entity: t('Employee review') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
