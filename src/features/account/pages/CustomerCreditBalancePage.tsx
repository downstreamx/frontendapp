import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NoRecordsFound } from '@/components/no-records-found'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { fetchCustomerBalanceSummary } from '../account-customer-balance-api'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CustomerCreditBalancePage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-customer-balance',
  )
  const [asOfDate, setAsOfDate] = useState(() => todayIso())
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  const [applied, setApplied] = useState({
    as_of_date: todayIso(),
    show_zero_balances: false,
  })

  useAccountPageChrome(t('Customer Balance Summary'), t('Credit Balance'))

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['account', 'customer-balance-summary', applied],
    queryFn: () =>
      fetchCustomerBalanceSummary({
        as_of_date: applied.as_of_date,
        show_zero_balances: applied.show_zero_balances,
      }),
  })

  const customers = data?.customers ?? []
  const loading = isLoading || isFetching

  const totals = customers.reduce(
    (acc, row) => ({
      invoiced: acc.invoiced + row.total_invoiced,
      returns: acc.returns + row.total_returns,
      paid: acc.paid + row.total_paid,
    }),
    { invoiced: 0, returns: 0, paid: 0 },
  )

  const openPrint = () => {
    const qs = new URLSearchParams({
      as_of_date: applied.as_of_date,
      print: '1',
    })
    if (applied.show_zero_balances) qs.set('show_zero_balances', '1')
    window.open(`${paths.account.creditBalancePrint}?${qs.toString()}`, '_blank')
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="border-b bg-muted/30 p-6">
        {canPrint && customers.length > 0 ? (
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={openPrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t('Print')}
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label className="mb-2 block text-sm font-medium">{t('As Of Date')}</Label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="mb-2 flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showZeroBalances}
                onCheckedChange={(checked) => setShowZeroBalances(checked === true)}
              />
              <span className="text-sm">{t('Show Zero Balances')}</span>
            </label>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => {
                setApplied({
                  as_of_date: asOfDate,
                  show_zero_balances: showZeroBalances,
                })
                void refetch()
              }}
            >
              {loading ? t('Loading...') : t('Generate')}
            </Button>
          </div>
        </div>
      </CardContent>

      <CardContent className="p-0">
        {customers.length > 0 && data ? (
          <>
            <div className="border-b bg-muted/20 p-4">
              <h3 className="text-lg font-semibold">{t('Customer Balance Summary')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('As of')} {data.as_of_date}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {t('Total Outstanding')}: {formatCurrency(data.total_balance)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('Customer')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('Email')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('Total Invoiced')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('Total Returns & Credit Notes')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Total Paid')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Balance')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('Available credit')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((row) => (
                    <tr key={row.customer_id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to={paths.account.customerShow(row.customer_id)}
                          className="text-primary hover:underline"
                        >
                          {row.customer_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.customer_email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.total_invoiced)}</td>
                      <td className="px-4 py-3 text-right text-destructive">
                        {formatCurrency(row.total_returns)}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.total_paid)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        {formatCurrency(row.available_credit)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-4 border-t-muted bg-muted/40 font-bold">
                    <td colSpan={2} className="px-4 py-4">
                      {t('Total')}
                    </td>
                    <td className="px-4 py-4 text-right">{formatCurrency(totals.invoiced)}</td>
                    <td className="px-4 py-4 text-right text-destructive">
                      {formatCurrency(totals.returns)}
                    </td>
                    <td className="px-4 py-4 text-right">{formatCurrency(totals.paid)}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(data.total_balance)}</td>
                    <td className="px-4 py-4 text-right">
                      {formatCurrency(
                        customers.reduce((sum, row) => sum + row.available_credit, 0),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <NoRecordsFound
            icon={FileText}
            title={loading ? t('Loading...') : t('No records found')}
            description={t('Adjust filters and generate the report.')}
            className="h-auto py-12"
          />
        )}
      </CardContent>
    </Card>
  )
}
