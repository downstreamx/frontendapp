import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { listOffersPaginated, offerCandidateLabel, type OfferListItem } from '../recruitment-offers-api'

export function OffersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()

  const page = Number(searchParams.get('page') ?? '1') || 1

  usePageChrome({
    pageTitle: t('Offers'),
    breadcrumbs: [{ label: t('Recruitment') }, { label: t('Offers') }],
  })

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      ...(toolbar.search ? { search: toolbar.search } : {}),
    }),
    [page, toolbar.perPage, toolbar.search],
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'offers', listParams],
    queryFn: () => listOffersPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const columns: Column<OfferListItem>[] = [
    {
      key: 'position',
      header: t('Position'),
      render: (_, row) => (
        <Link to={paths.recruitment.offerShow(row.id)} className="font-medium text-primary hover:underline">
          {row.position ?? '—'}
        </Link>
      ),
    },
    {
      key: 'candidate',
      header: t('Candidate'),
      render: (_, row) => offerCandidateLabel(row),
    },
    {
      key: 'offer_date',
      header: t('Offer date'),
      render: (_, row) => (row.offer_date ? formatDate(row.offer_date) : '—'),
    },
    {
      key: 'salary',
      header: t('Salary'),
      render: (_, row) => (row.salary != null ? formatCurrency(Number(row.salary)) : '—'),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <FleetStatusBadge status={row.status ?? 'Draft'} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={paths.recruitment.offerShow(row.id)} title={t('View')}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('Offers')}
      description={t('Manage job offers and track candidate responses.')}
      canCreate
      onCreateClick={() => navigate(paths.recruitment.offerCreate)}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: toolbar.applySearch,
        searchPlaceholder: t('Search offers...'),
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
          icon={Gift}
          title={t('No offers found')}
          description={t('Create an offer for a qualified candidate.')}
          onCreateClick={() => navigate(paths.recruitment.offerCreate)}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded columns={columns} data={rows} />
      )}
    </ModuleListCard>
  )
}
