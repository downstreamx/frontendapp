import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DateRangeReportForm } from '@/features/double-entry/components/DateRangeReportForm'
import { defaultReportDateRange } from '@/features/double-entry/utils/default-date-range'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import { fetchPortalDistributionReport } from '../portal-api'
import type { BridgingReportRow } from '@/features/reports/reports-api'
import { usePortalPageChrome } from '../hooks/use-portal-page-chrome'
import { formatCurrency, formatDate } from '@/utils/helpers'

export function PortalDistributionReportPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaults = defaultReportDateRange()
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? defaults.from)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? defaults.to)

  usePortalPageChrome(t('Distribution report'))

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      date_from: searchParams.get('date_from') ?? dateFrom,
      date_to: searchParams.get('date_to') ?? dateTo,
      per_page: searchParams.get('per_page') ?? '15',
    }
    const page = searchParams.get('page')
    if (page) params.page = page
    return params
  }, [dateFrom, dateTo, searchParams])

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', 'distribution-report', queryParams],
    queryFn: () => fetchPortalDistributionReport(queryParams),
  })

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.set('date_from', dateFrom)
    next.set('date_to', dateTo)
    next.delete('page')
    setSearchParams(next)
  }

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  const columns: Column<BridgingReportRow>[] = [
    { key: 'invoice_number', header: t('Invoice #') },
    {
      key: 'invoice_date',
      header: t('Date'),
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'total_amount',
      header: t('Amount'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    { key: 'load_count', header: t('Loads') },
    { key: 'total_loaded_qty', header: t('Loaded qty') },
    { key: 'status', header: t('Status') },
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{t('Distribution report')}</CardTitle>
        <CardDescription>{t('Your sales invoices and assigned truck loads.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DateRangeReportForm
          fromDate={dateFrom}
          toDate={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onRun={applyFilters}
          isLoading={isLoading}
        />

        {isLoading ? <DashboardLoading /> : null}
        {error ? <DashboardError message={t('Failed to load distribution report.')} /> : null}

        {!isLoading && !error && data ? (
          <>
            <DataTable embedded data={data.data} columns={columns} searchable />
            {data.meta.last_page > 1 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('Page {{current}} of {{last}}', {
                    current: data.meta.current_page,
                    last: data.meta.last_page,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.current_page <= 1}
                    onClick={() => goToPage(data.meta.current_page - 1)}
                  >
                    {t('Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => goToPage(data.meta.current_page + 1)}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
