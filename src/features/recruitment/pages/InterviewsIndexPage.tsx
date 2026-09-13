import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  interviewCandidateLabel,
  listInterviewsPaginated,
  type InterviewListItem,
} from '../recruitment-interviews-api'

export function InterviewsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Interviews'),
    breadcrumbs: [{ label: t('Recruitment') }, { label: t('Interviews') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'interviews', listParams],
    queryFn: () => listInterviewsPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<InterviewListItem>[] = [
    {
      key: 'candidate',
      header: t('Candidate'),
      render: (_, row) => (
        <Link to={paths.recruitment.interviewShow(row.id)} className="font-medium text-primary hover:underline">
          {interviewCandidateLabel(row)}
        </Link>
      ),
    },
    {
      key: 'scheduled_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => (row.scheduled_date ? formatDate(row.scheduled_date) : '—'),
    },
    {
      key: 'round',
      header: t('Round'),
      render: (_, row) => row.interview_round?.name ?? row.interviewRound?.name ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <FleetStatusBadge status={row.status ?? 'Scheduled'} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={paths.recruitment.interviewShow(row.id)} title={t('View')}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('Interviews')}
      description={t('Schedule and track candidate interviews.')}
      canCreate
      onCreateClick={() => navigate(paths.recruitment.interviewCreate)}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: toolbar.applySearch,
        searchPlaceholder: t('Search interviews...'),
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
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
          icon={Calendar}
          title={t('No interviews found')}
          description={t('Schedule your first interview to get started.')}
          onCreateClick={() => navigate(paths.recruitment.interviewCreate)}
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
