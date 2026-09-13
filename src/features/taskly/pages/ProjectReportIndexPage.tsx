import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatDate } from '@/utils/helpers'
import { route } from '@/lib/route'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import {
  listProjectReportsPaginated,
  PROJECT_STATUSES,
  type ProjectReportListRow,
} from '../taskly-api'

type AppliedFilters = {
  status: string
  date: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  date: '',
}

function RatioCell({ value }: { value: string }) {
  const [completed, total] = (value || '0/0').split('/')
  const allDone = completed === total && total !== '0'

  return <span className={allDone ? 'font-semibold text-green-600' : ''}>{value || '0/0'}</span>
}

export function ProjectReportIndexPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'

  const canView =
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-project-report') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-project-report')

  usePageChrome({
    pageTitle: t('Manage Project Reports'),
    breadcrumbs: [{ label: t('Project') }, { label: t('Project Reports') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.name = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.date) params.date = appliedFilters.date
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['taskly', 'project-reports', listParams],
    queryFn: () => listProjectReportsPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.status, appliedFilters.date].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<ProjectReportListRow>[] = [
    {
      key: 'name',
      header: t('Project Name'),
      sortable: true,
      render: (_, row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'tasks_count',
      header: t('Tasks'),
      render: (_, row) => <RatioCell value={row.tasks_count} />,
    },
    {
      key: 'bugs_count',
      header: t('Bugs'),
      render: (_, row) => <RatioCell value={row.bugs_count} />,
    },
    {
      key: 'milestones_count',
      header: t('Milestones'),
      render: (_, row) => <RatioCell value={row.milestones_count} />,
    },
    {
      key: 'start_date',
      header: t('Start Date'),
      sortable: true,
      render: (_, row) => (row.start_date ? formatDate(row.start_date) : '—'),
    },
    {
      key: 'end_date',
      header: t('End Date'),
      sortable: true,
      render: (_, row) => {
        if (!row.end_date) return '—'
        const overdue = new Date(row.end_date) < new Date()
        return <span className={overdue ? 'text-destructive' : ''}>{formatDate(row.end_date)}</span>
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <ProjectStatusBadge status={row.status} />,
    },
    ...(canView
      ? [
          {
            key: 'actions',
            header: t('Actions'),
            render: (_: unknown, row: ProjectReportListRow) => (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" asChild>
                <Link to={route('project.report.show', { id: row.id })} title={t('View')}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            ),
          } satisfies Column<ProjectReportListRow>,
        ]
      : []),
  ]

  return (
    <ModuleListCard
      title={t('Project Reports')}
      description={t('Summary of tasks, bugs, and milestones across projects.')}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search projects...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select
                value={draftFilters.status || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Filter by status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All statuses')}</SelectItem>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="report-date">{t('Active on date')}</Label>
              <Input
                id="report-date"
                type="date"
                value={draftFilters.date}
                onChange={(e) => setDraftFilters((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" size="sm" onClick={applyFilters}>
                {t('Apply')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                {t('Clear')}
              </Button>
            </div>
          </div>
        ) : undefined,
      }}
      pagination={
        pagination
          ? {
              ...pagination,
              onPageChange: (p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              },
            }
          : undefined
      }
    >
      {rows.length === 0 && !isLoading ? (
        <NoRecordsFound
          icon={BarChart3}
          title={t('No projects found')}
          description={t('No projects match your report filters.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          className="h-auto py-8"
        />
      ) : (
        <DataTable
          embedded
          columns={columns}
          data={rows}
          sortKey={sortField || undefined}
          sortDirection={sortDirection}
          onSort={setSort}
        />
      )}
    </ModuleListCard>
  )
}
