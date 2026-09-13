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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { personName } from '@/features/shared/lib/entity-labels'
import {
  deleteTimesheet,
  listTimesheetsPaginated,
  type TimesheetRow,
} from '../timesheet-api'
import { useTimesheetsIndexMeta } from '../hooks/use-timesheet-meta'

type AppliedFilters = { user_id: string; type: string }
const defaultFilters: AppliedFilters = { user_id: '', type: '' }

export function TimesheetsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { meta } = useTimesheetsIndexMeta()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Timesheets'),
    breadcrumbs: [{ label: t('Timesheet') }, { label: t('Timesheets') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.user_id) params.user_id = appliedFilters.user_id
    if (appliedFilters.type) params.type = appliedFilters.type
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['timesheet', 'timesheets', listParams],
    queryFn: () => listTimesheetsPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['timesheet', 'timesheets'] })

  const deleteMutation = useMutation({
    mutationFn: deleteTimesheet,
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

  const formatDuration = (row: TimesheetRow) => {
    const hours = row.hours ?? 0
    const minutes = row.minutes ?? 0
    if (minutes > 0) return `${hours}h ${minutes}m`
    return `${hours}h`
  }

  const columns: Column<TimesheetRow>[] = [
    {
      key: 'user',
      header: t('User'),
      render: (_, row) => personName(row.user ?? undefined, row.user_id),
    },
    {
      key: 'date',
      header: t('Date'),
      sortable: true,
      render: (_, row) =>
        row.date ? (
          <Link
            to={paths.timesheet.show(row.id)}
            className="font-medium text-primary hover:underline"
          >
            {formatDate(row.date)}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'duration',
      header: t('Duration'),
      sortable: true,
      render: (_, row) => formatDuration(row),
    },
    {
      key: 'type',
      header: t('Type'),
      sortable: true,
      render: (_, row) => (row.type ? <span className="capitalize">{row.type}</span> : '—'),
    },
    {
      key: 'notes',
      header: t('Notes'),
      render: (_, row) => row.notes ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="manage-timesheet"
          deletePermission="manage-timesheet"
          onEdit={() => navigate(paths.timesheet.edit(row.id))}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Timesheets')}
        description={t('Log and review employee time entries.')}
        canCreate
        onCreateClick={() => navigate(paths.timesheet.create)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search timesheets...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('User')}</Label>
                <Select
                  value={draftFilters.user_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, user_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All users')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All users')}</SelectItem>
                    {(meta?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Type')}</Label>
                <Select
                  value={draftFilters.type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, type: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {(meta?.types ?? []).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            onCreateClick={() => navigate(paths.timesheet.create)}
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
        title={t('Delete {{entity}}', { entity: t('Timesheet entry') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}