import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { listBalanceSheetComparisons, type BalanceSheetComparison } from '../balance-sheets-api'

export function BalanceSheetComparisonsPage() {
  const { t } = useTranslation()
  useDoubleEntryPageChrome(t('Balance sheet comparisons'), t('Reports'))

  const [searchParams, setSearchParams] = useSearchParams()
  const perPage = searchParams.get('per_page') ?? '15'
  const page = Number(searchParams.get('page') ?? '1')

  const listQuery = useQuery({
    queryKey: ['balance-sheet-comparisons', perPage, page],
    queryFn: () => listBalanceSheetComparisons({ page, per_page: Number(perPage) }),
  })

  const { rows = [], meta } = listQuery.data ?? {
    rows: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
  }

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const columns: Column<BalanceSheetComparison>[] = [
    {
      key: 'comparison_date',
      header: t('Comparison date'),
      render: (_, row) => formatDate(row.comparison_date),
    },
    {
      key: 'current_period',
      header: t('Current period'),
      render: (_, row) =>
        row.current_period
          ? `${formatDate(row.current_period.balance_sheet_date)} (${row.current_period.financial_year})`
          : '—',
    },
    {
      key: 'previous_period',
      header: t('Previous period'),
      render: (_, row) =>
        row.previous_period
          ? `${formatDate(row.previous_period.balance_sheet_date)} (${row.previous_period.financial_year})`
          : '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to={paths.doubleEntry.balanceSheetComparisonShow(row.id)}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('Balance sheet comparisons')}
      description={t('Saved period-over-period balance sheet comparisons.')}
      actions={
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={paths.doubleEntry.balanceSheets}>{t('Balance sheets')}</Link>
        </Button>
      }
      isLoading={listQuery.isLoading}
      error={!!listQuery.error}
      searchToolbar={{
        searchValue: '',
        onSearchChange: () => undefined,
        onSearch: () => undefined,
        showFilters: false,
        onToggleFilters: () => undefined,
        showFilterActions: false,
        controls: (
          <PerPageSelector
            value={perPage}
            onChange={(value) => updateParams({ per_page: value, page: '1' })}
          />
        ),
      }}
      pagination={{ ...meta, onPageChange: (p) => updateParams({ page: String(p) }) }}
    >
      {!listQuery.isLoading && rows.length === 0 ? (
        <NoRecordsFound
          icon={GitCompare}
          title={t('No comparisons found')}
          description={t('Create a comparison from a balance sheet detail page.')}
          className="h-auto py-12"
        />
      ) : (
        <DataTable data={rows} columns={columns} className="rounded-none border-0" />
      )}
    </ModuleListCard>
  )
}
