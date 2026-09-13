import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { fetchHelpdeskMeta, listHelpdeskTicketsPaginated, type HelpdeskTicketListRow } from '../helpdesk-api'

type AppliedFilters = {
  status: string
  priority: string
  category_id: string
  company_id: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  priority: '',
  category_id: '',
  company_id: '',
}

export function HelpdeskTicketsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const metaQuery = useQuery({ queryKey: ['helpdesk', 'meta'], queryFn: fetchHelpdeskMeta })
  const platformContext =
    auth.user?.type === 'superadmin' || Boolean(metaQuery.data?.platform_context)

  usePageChrome({
    pageTitle: t('Helpdesk tickets'),
    breadcrumbs: [{ label: t('Helpdesk') }, { label: t('Tickets') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.title = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.priority) params.priority = appliedFilters.priority
    if (appliedFilters.category_id) params.category_id = appliedFilters.category_id
    if (appliedFilters.company_id) params.company_id = appliedFilters.company_id
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['helpdesk', 'tickets', listParams],
    queryFn: () => listHelpdeskTicketsPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const categories = metaQuery.data?.categories ?? []
  const companies = metaQuery.data?.companies ?? []

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

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

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<HelpdeskTicketListRow>[] = [
    {
      key: 'ticket_id',
      header: t('Ticket #'),
      render: (_, row) => row.ticket_id ?? String(row.id),
    },
    {
      key: 'title',
      header: t('Title'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.helpdeskTicketShow(row.id)} className="font-medium text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    ...(platformContext
      ? [
          {
            key: 'company',
            header: t('Company'),
            render: (_: unknown, row: HelpdeskTicketListRow) => row.creator?.name ?? '—',
          } as Column<HelpdeskTicketListRow>,
        ]
      : []),
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.category?.name ?? '—',
    },
    {
      key: 'priority',
      header: t('Priority'),
      render: (_, row) =>
        row.priority ? <FleetStatusBadge status={row.priority} label={row.priority} /> : '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) =>
        row.status ? <FleetStatusBadge status={row.status} label={row.status} /> : '—',
    },
  ]

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link to={paths.helpdeskCategories}>{t('Categories')}</Link>
      </Button>
      <Button size="sm" onClick={() => navigate(paths.helpdeskTicketCreate)}>
        <Plus className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">{t('New ticket')}</span>
      </Button>
    </div>
  )

  return (
    <ModuleListCard
      title={t('Helpdesk tickets')}
      description={t('Track and resolve support requests from companies.')}
      actions={headerActions}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search by title or ticket #…'),
        showFilters,
        onToggleFilters: () => setShowFilters((v) => !v),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformContext ? (
              <div className="space-y-1">
                <Label>{t('Company')}</Label>
                <Select
                  value={draftFilters.company_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, company_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All companies')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All companies')}</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
                  {(metaQuery.data?.statuses ?? []).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
                  {(metaQuery.data?.priorities ?? []).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
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
      {rows.length === 0 ? (
        <NoRecordsFound
          icon={Ticket}
          title={t('No tickets found')}
          description={t('Create a ticket to start helping companies.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onCreateClick={() => navigate(paths.helpdeskTicketCreate)}
          createButtonText={t('New ticket')}
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
