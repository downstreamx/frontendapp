import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import type { PosSale } from '../pos-api'
import { PosSaleTotals } from './PosSaleTotals'

type Props = {
  sale: PosSale
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function PosSaleReceiptLayout({ sale, companySettings, autoPrint = false }: Props) {
  const { t } = useTranslation()
  const items = sale.items ?? []

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  const companyName = setting(companySettings, 'company_name') || setting(companySettings, 'title_text')

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="sale-container mx-auto max-w-4xl p-8 print:p-4">
        <header className="mb-10 flex justify-between gap-6 border-b pb-6">
          <div className="w-1/2">
            <h1 className="text-2xl font-bold">{companyName || t('Company')}</h1>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {setting(companySettings, 'company_address') ? (
                <p>{setting(companySettings, 'company_address')}</p>
              ) : null}
              {(setting(companySettings, 'company_city') || setting(companySettings, 'company_state')) && (
                <p>
                  {setting(companySettings, 'company_city')}
                  {setting(companySettings, 'company_city') && setting(companySettings, 'company_state')
                    ? ', '
                    : ''}
                  {setting(companySettings, 'company_state')}
                </p>
              )}
              {(setting(companySettings, 'company_country') || setting(companySettings, 'company_zipcode')) && (
                <p>
                  {setting(companySettings, 'company_country')} - {setting(companySettings, 'company_zipcode')}
                </p>
              )}
              {setting(companySettings, 'company_telephone') ? (
                <p>
                  {t('Phone')}: {setting(companySettings, 'company_telephone')}
                </p>
              ) : null}
              {setting(companySettings, 'company_email') ? (
                <p>
                  {t('Email')}: {setting(companySettings, 'company_email')}
                </p>
              ) : null}
            </div>
          </div>
          <div className="w-1/2 text-right">
            <h2 className="text-2xl font-bold">{t('POS SALE')}</h2>
            <p className="text-lg font-semibold">{sale.sale_number}</p>
            <p className="mt-2 text-sm text-gray-600">
              {t('Date')}: {formatDate(sale.created_at ?? sale.pos_date)}
            </p>
          </div>
        </header>

        <div className="mb-10 flex justify-between gap-6">
          <div>
            <h3 className="mb-2 font-bold">{t('CUSTOMER')}</h3>
            <p className="font-semibold">{sale.customer?.name ?? t('Walk-in Customer')}</p>
            {sale.customer?.email ? <p className="text-sm text-gray-600">{sale.customer.email}</p> : null}
          </div>
          <div className="text-right">
            <h3 className="mb-2 font-bold">{t('WAREHOUSE')}</h3>
            <p className="font-semibold">{sale.depot?.name ?? '—'}</p>
          </div>
        </div>

        <table className="mb-8 w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 text-left font-bold">{t('Product')}</th>
              <th className="py-3 text-center font-bold">{t('Qty')}</th>
              <th className="py-3 text-right font-bold">{t('Unit Price')}</th>
              <th className="py-3 text-center font-bold">{t('Tax')}</th>
              <th className="py-3 text-right font-bold">{t('Tax Amount')}</th>
              <th className="py-3 text-right font-bold">{t('Total')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3">
                  <div className="font-semibold">{item.product?.name ?? `#${item.product_id}`}</div>
                  {item.product?.sku ? (
                    <div className="text-xs text-gray-500">
                      {t('SKU')}: {item.product.sku}
                    </div>
                  ) : null}
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(Number(item.price))}</td>
                <td className="py-3 text-center text-xs">
                  {item.taxes && item.taxes.length > 0
                    ? item.taxes.map((tax) => (
                        <div key={tax.id}>
                          {tax.tax_name} ({tax.rate}%)
                        </div>
                      ))
                    : '—'}
                </td>
                <td className="py-3 text-right">
                  {Number(item.tax_amount) > 0 ? formatCurrency(Number(item.tax_amount)) : '—'}
                </td>
                <td className="py-3 text-right font-semibold">
                  {formatCurrency(Number(item.total_amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-8 flex justify-end">
          <PosSaleTotals sale={sale} bordered />
        </div>

        <footer className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
          <p>{t('Thank you for your business!')}</p>
          <p className="mt-2 capitalize">
            {t('Status')}: {sale.status}
          </p>
        </footer>
      </div>
    </div>
  )
}
