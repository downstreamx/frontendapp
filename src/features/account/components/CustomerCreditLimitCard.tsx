import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import type { CustomerCreditLimitMetrics } from '../account-customer-credit-api'

type Props = {
  metrics: CustomerCreditLimitMetrics
}

export function CustomerCreditLimitCard({ metrics }: Props) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t('Credit limit')}</h3>
        <Link
          to={paths.account.customerLimitsBalances}
          className="text-sm text-primary hover:underline"
        >
          {t('Customer Limits & Balances')}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Credit limit')}</p>
          <p className="text-lg font-semibold">
            {metrics.credit_limit != null ? formatCurrency(metrics.credit_limit) : '—'}
          </p>
          {metrics.credit_limit_required ? (
            <p className="mt-1 text-xs text-destructive">
              {t('Required before posting credit-term invoices')}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Closing balance')}</p>
          <p className="text-lg font-semibold">{formatCurrency(metrics.closing_balance)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Available credit')}</p>
          <p className="text-lg font-semibold text-emerald-700">
            {formatCurrency(metrics.available_credit)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Over limit')}</p>
          {metrics.over_credit_limit ? (
            <Badge variant="destructive">{t('Yes')}</Badge>
          ) : (
            <Badge variant="secondary">{t('No')}</Badge>
          )}
        </div>
      </div>
    </section>
  )
}
