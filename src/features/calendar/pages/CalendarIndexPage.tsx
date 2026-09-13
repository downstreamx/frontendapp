import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
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
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatDate } from '@/utils/helpers'
import {
  fetchCalendarEventsIndexMeta,
  listCalendarEventsPaginated,
  type CalendarEventRow,
} from '../calendar-api'

type AppliedFilters = {
  module: string
  type: string
}

const defaultFilters: AppliedFilters = {
  module: '',
  type: '',
}

function formatRange(start?: string, end?: string) {
  if (!start) return '—'
  if (!end || end === start) return formatDate(start)
  return `${formatDate(start)} → ${formatDate(end)}`
}

export function CalendarIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  useEffect(() => {
    const module = searchParams.get('module') ?? ''
    const type = searchParams.get('type') ?? ''
    if (!module && !type) return
    const next = { module, type }
    setDraftFilters(next)
    setAppliedFilters(next)
  }, [searchParams])

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Calendar'),
    breadcrumbs: [{ label: t('Calendar') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.module) params.module = appliedFilters.module
    if (appliedFilters.type) params.type = appliedFilters.type
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', 'events', listParams],
    queryFn: () => listCalendarEventsPaginated(listParams),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['calendar', 'events', 'index-meta'],
    queryFn: fetchCalendarEventsIndexMeta,
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

  const columns: Column<CalendarEventRow>[] = [
    {
      key: 'title',
      header: t('Event'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.color ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
          ) : null}
          <span>{row.title}</span>
        </div>
      ),
    },
    {
      key: 'start_date',
      header: t('Dates'),
      sortable: true,
      render: (_, row) => formatRange(row.start_date, row.end_date),
    },
    {
      key: 'type',
      header: t('Type'),
      render: (_, row) => (row.type ? <span className="capitalize">{row.type}</span> : '—'),
    },
    {
      key: 'module',
      header: t('Module'),
      render: (_, row) => row.module ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => (row.status ? <FleetStatusBadge status={row.status} /> : '—'),
    },
  ]

  return (
    <ModuleListCard
      title={t('Calendar')}
      description={t('Aggregated events from HRM holidays, leave, and approved events.')}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search events...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Module')}</Label>
              <Select
                value={draftFilters.module || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, module: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All modules')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All modules')}</SelectItem>
                  {(indexMeta?.modules ?? []).map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
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
                  {(indexMeta?.types ?? []).map((type) => (
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
          icon={CalendarDays}
          title={t('No events found')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          className="h-auto py-8"
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
  )
}
