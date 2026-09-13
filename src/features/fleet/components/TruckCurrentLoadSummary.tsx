import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { truckLoadPhaseLabel } from '@/features/bridging/bridging-status-ui'
import { paths } from '@/lib/paths'
import type { TruckCurrentLoad } from '../fleet-api'

type Props = {
  load?: TruckCurrentLoad | null
}

export function TruckCurrentLoadSummary({ load }: Props) {
  const { t } = useTranslation()
  if (!load) {
    return <p className="text-sm text-muted-foreground">{t('No active truck load.')}</p>
  }

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">{t('Load number')}</dt>
        <dd className="font-medium">{load.load_number ?? `#${load.id}`}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{t('Phase')}</dt>
        <dd>{load.phase ? truckLoadPhaseLabel(load.phase, t) : '—'}</dd>
      </div>
      {load.purchase_invoice_number ? (
        <div>
          <dt className="text-muted-foreground">{t('Purchase invoice')}</dt>
          <dd>
            {load.purchase_invoice_id ? (
              <Link
                to={`${paths.purchase.invoices}/${load.purchase_invoice_id}`}
                className="text-primary hover:underline"
              >
                {load.purchase_invoice_number}
              </Link>
            ) : (
              load.purchase_invoice_number
            )}
          </dd>
        </div>
      ) : null}
      {load.sales_invoice_number ? (
        <div>
          <dt className="text-muted-foreground">{t('Sales invoice')}</dt>
          <dd>
            {load.sales_invoice_id ? (
              <Link
                to={`${paths.sales.invoices}/${load.sales_invoice_id}`}
                className="text-primary hover:underline"
              >
                {load.sales_invoice_number}
              </Link>
            ) : (
              load.sales_invoice_number
            )}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
