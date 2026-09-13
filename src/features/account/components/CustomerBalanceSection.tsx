import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/helpers'
import type { CustomerBalanceMetrics } from '../account-customer-balance-api'
import { paths } from '@/lib/paths'

type Props = {
  balance: CustomerBalanceMetrics | null | undefined
  showReportLink?: boolean
}

export function CustomerBalanceSection({ balance, showReportLink }: Props) {
  const { t } = useTranslation()

  if (!balance) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t('Account balance')}</h3>
        {showReportLink ? (
          <Link
            to={paths.account.creditBalance}
            className="text-sm text-primary hover:underline"
          >
            {t('Customer Balance Summary')}
          </Link>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Outstanding balance')}</p>
          <p className="text-lg font-semibold">{formatCurrency(balance.outstanding_balance)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-sm font-semibold">{t('Available credit')}</p>
          <p className="text-lg font-semibold text-emerald-700">
            {formatCurrency(balance.available_credit)}
          </p>
        </div>
      </div>
      {balance.as_of_date ? (
        <p className="text-xs text-muted-foreground">
          {t('As of')} {balance.as_of_date}
        </p>
      ) : null}
    </section>
  )
}
