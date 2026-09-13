import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import { fetchPortalInvoices, type PortalInvoiceRow } from '../portal-api'
import { usePortalPageChrome } from '../hooks/use-portal-page-chrome'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import {
  salesDistributionStatusBadgeClass,
  salesDistributionStatusLabel,
} from '@/features/bridging/bridging-status-ui'

export function PortalInvoicesIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = searchParams.get('page') ?? '1'

  usePortalPageChrome(t('Invoices'))

  const listParams = useMemo(
    () => ({ page, per_page: searchParams.get('per_page') ?? '15' }),
    [page, searchParams],
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', 'invoices', listParams],
    queryFn: () => fetchPortalInvoices(listParams),
  })

  const rows = data?.data ?? []
  const meta = data?.meta

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<PortalInvoiceRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice #'),
      render: (_, row) => (
        <Link
          to={paths.portal.invoiceShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.invoice_number}
        </Link>
      ),
    },
    {
      key: 'invoice_date',
      header: t('Date'),
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'due_date',
      header: t('Due'),
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'total_amount',
      header: t('Total'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'balance_amount',
      header: t('Balance'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    { key: 'status', header: t('Financial status') },
    {
      key: 'distribution_status',
      header: t('Distribution'),
      render: (_, row) => (
        <span className={salesDistributionStatusBadgeClass(row.distribution_status)}>
          {salesDistributionStatusLabel(row.distribution_status, t)}
        </span>
      ),
    },
    { key: 'undistributed_qty', header: t('Undistributed qty') },
    {
      key: 'distributed_qty',
      header: t('Distributed qty'),
      render: (_, row) =>
        Number(row.distributed_qty ?? row.bridged_qty ?? 0).toLocaleString(),
    },
  ]

  if (isLoading) return <DashboardLoading />
  if (error) return <DashboardError message={t('Could not load invoices.')} />

  return (
    <ModuleListCard title={t('My invoices')} description={t('Posted sales invoices for your account.')}>
      <DataTable embedded data={rows} columns={columns} searchable />
      {meta && meta.last_page > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('Page {{current}} of {{last}}', {
              current: meta.current_page,
              last: meta.last_page,
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
            >
              {t('Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      ) : null}
    </ModuleListCard>
  )
}
