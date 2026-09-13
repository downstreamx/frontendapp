import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { fetchCustomerBalanceSummary } from '../account-customer-balance-api'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useEffect } from 'react'

function setting(settings: Record<string, string>, key: string) {
  return settings[key] || ''
}

export function CustomerCreditBalancePrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const [params] = useSearchParams()

  const asOfDate = params.get('as_of_date') ?? new Date().toISOString().slice(0, 10)
  const showZero = params.get('show_zero_balances') === '1'
  const autoPrint = params.get('print') === '1'

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-balance-print', asOfDate, showZero],
    queryFn: () =>
      fetchCustomerBalanceSummary({
        as_of_date: asOfDate,
        show_zero_balances: showZero,
      }),
  })

  useEffect(() => {
    if (!autoPrint) return
    const id = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(id)
  }, [autoPrint])

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  const companyName = setting(settings, 'company_name') || setting(settings, 'title_text')

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:min-h-0 print:p-4">
      <header className="mb-8 border-b pb-4 text-center">
        {companyName ? <h1 className="text-2xl font-bold">{companyName}</h1> : null}
        <h2 className="mt-2 text-xl font-semibold">{t('Customer balance')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('As of')} {formatDate(data.as_of_date)}
        </p>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">{t('Customer')}</th>
            <th className="py-1 text-right">{t('Balance')}</th>
            <th className="py-1 text-right">{t('Available credit')}</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.map((row) => (
            <tr key={row.customer_id} className="border-b">
              <td className="py-1">{row.customer_name}</td>
              <td className="py-1 text-right">{formatCurrency(row.balance)}</td>
              <td className="py-1 text-right">{formatCurrency(row.available_credit)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-1">{t('Total')}</td>
            <td className="py-1 text-right">{formatCurrency(data.total_balance)}</td>
            <td className="py-1 text-right">
              {formatCurrency(data.customers.reduce((s, r) => s + r.available_credit, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
