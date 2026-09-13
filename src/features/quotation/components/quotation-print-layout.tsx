import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { Quotation } from '../quotations-api'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  quotation: Quotation
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function QuotationPrintLayout({ quotation, companySettings, autoPrint = false }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:min-h-0">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{setting(companySettings, 'company_name') || t('Quotation')}</h1>
            <p className="text-sm text-gray-600">{setting(companySettings, 'company_address')}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold">{quotation.quotation_number}</p>
            <p>
              {t('Date')}: {formatDate(quotation.quotation_date)}
            </p>
            <p>
              {t('Due')}: {formatDate(quotation.due_date)}
            </p>
            <p className="capitalize">
              {t('Status')}: {quotation.status}
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold uppercase text-gray-500">{t('Customer')}</h2>
          <p className="font-medium">{quotation.customer?.name}</p>
          {quotation.customer?.email ? <p className="text-sm text-gray-600">{quotation.customer.email}</p> : null}
          {quotation.depot?.name ? (
            <p className="text-sm text-gray-600">
              {t('Depot')}: {quotation.depot.name}
            </p>
          ) : null}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">{t('Product')}</th>
              <th className="p-2 text-right">{t('Qty')}</th>
              <th className="p-2 text-right">{t('Unit price')}</th>
              <th className="p-2 text-right">{t('Total')}</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.items ?? []).map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.product?.name ?? `#${item.product_id}`}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                <td className="p-2 text-right">{formatCurrency(Number(item.total_amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <p className="text-lg font-semibold">
            {t('Total')}: {formatCurrency(Number(quotation.total_amount ?? 0))}
          </p>
        </div>

        {quotation.notes ? (
          <div>
            <h2 className="mb-1 text-sm font-semibold">{t('Notes')}</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{quotation.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
