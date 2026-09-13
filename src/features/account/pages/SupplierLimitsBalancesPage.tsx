import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  fetchSupplierLimitsBalances,
  type SupplierLimitsBalanceRow,
} from '../account-supplier-limits-api'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function SupplierLimitsBalancesPage() {
  const { t } = useTranslation()
  const [asOfDate, setAsOfDate] = useState(() => todayIso())
  const [applied, setApplied] = useState({ as_of_date: todayIso() })

  useAccountPageChrome(t('Supplier Limits & Balances'), t('Suppliers'))

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['account', 'supplier-limits-balances', applied],
    queryFn: () => fetchSupplierLimitsBalances({ as_of_date: applied.as_of_date, per_page: '100' }),
  })

  const rows = data?.rows ?? []
  const loading = isLoading || isFetching

  const columns: Column<SupplierLimitsBalanceRow>[] = [
    {
      key: 'company_name',
      header: t('Supplier'),
      render: (_, row) => (
        <Link to={paths.account.supplierShow(row.id)} className="text-primary hover:underline">
          {row.company_name}
        </Link>
      ),
    },
    {
      key: 'supplier_code',
      header: t('Code'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'credit_limit',
      header: t('Credit limit'),
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
    },
    {
      key: 'closing_balance',
      header: t('Closing balance'),
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'available_credit',
      header: t('Available credit'),
      render: (_, row) => formatCurrency(row.available_credit),
    },
    {
      key: 'over_credit_limit',
      header: t('Over limit'),
      render: (_, row) =>
        row.over_credit_limit ? (
          <span className="text-xs font-medium text-destructive">{t('Yes')}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t('No')}</span>
        ),
    },
  ]

  return (
    <ModuleListCard title={t('Supplier limits & balances')} isLoading={loading}>
      <div className="mb-6 flex flex-wrap items-end gap-4 border-b pb-6">
        <div>
          <Label className="mb-2 block text-sm font-medium">{t('As of date')}</Label>
          <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => {
            setApplied({ as_of_date: asOfDate })
            void refetch()
          }}
        >
          {t('Apply')}
        </Button>
        {data?.as_of_date ? (
          <p className="text-sm text-muted-foreground">
            {t('Showing balances as of {{date}}', { date: data.as_of_date })}
          </p>
        ) : null}
      </div>

      {rows.length === 0 && !loading ? (
        <NoRecordsFound
          icon={Building2}
          title={t('No suppliers found')}
          description={t('Supplier credit limits and balances will appear here.')}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
