import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import type { SupplierPurchaseHistoryRow } from '../account-party-api'

type Props = {
  rows: SupplierPurchaseHistoryRow[]
}

export function SupplierPurchaseHistoryTable({ rows }: Props) {
  const { t } = useTranslation()

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('No purchase history.')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-semibold">{t('Invoice')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('Date')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Total')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Balance')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Bridged qty')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('Status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2">
                <Link
                  to={`${paths.purchase.invoices}/${row.id}`}
                  className="text-primary hover:underline"
                >
                  {row.invoice_number}
                </Link>
              </td>
              <td className="px-3 py-2">{formatDate(row.invoice_date)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(row.total_amount)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(row.balance_amount)}</td>
              <td className="px-3 py-2 text-right">{Number(row.bridged_qty).toLocaleString()}</td>
              <td className="px-3 py-2 capitalize">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
