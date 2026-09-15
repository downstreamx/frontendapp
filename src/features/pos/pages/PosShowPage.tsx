import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getActiveSettings } from '@/lib/page-props-bridge'
import { hasPermission } from '@/lib/permissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getPosSale } from '../pos-api'
import { PosSaleTotals } from '../components/PosSaleTotals'
import { PageContentLoader } from '@/components/ui/page-content-loader'

function companySetting(settings: Record<string, string>, key: string) {
  return settings[key] || ''
}

export function PosShowPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const appContext = useAppContext()
  const { auth } = appContext
  const settings = getActiveSettings(appContext)
  const saleId = Number(id)

  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-pos-orders',
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos', saleId],
    queryFn: () => getPosSale(saleId),
    enabled: Number.isFinite(saleId) && canView,
  })

  usePageChrome({
    pageTitle: data?.sale_number ?? t('POS sale'),
    breadcrumbs: [
      { label: t('POS'), url: paths.pos.index },
      { label: t('Orders'), url: paths.pos.orders },
      { label: data?.sale_number ?? `#${id}` },
    ],
  })

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">{t('You do not have permission to view POS orders.')}</p>
    )
  }

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">{t('Sale not found.')}</p>
  }

  const items = data.items ?? []
  const displayTotal =
    data.total_amount ??
    data.payment?.final_amount ??
    items.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>{data.sale_number}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{formatDate(data.created_at ?? data.pos_date)}</span>
              <FleetStatusBadge status={data.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(displayTotal)}</p>
            <p className="text-sm text-muted-foreground">{t('Total Amount')}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold">{t('COMPANY')}</h3>
              <div className="space-y-1 text-sm">
                <p className="font-bold">{companySetting(settings, 'company_name') || t('Company')}</p>
                {companySetting(settings, 'company_address') ? (
                  <p className="text-muted-foreground">{companySetting(settings, 'company_address')}</p>
                ) : null}
                <p className="text-muted-foreground">
                  {companySetting(settings, 'company_city') || t('City')},{' '}
                  {companySetting(settings, 'company_state') || t('State')}
                </p>
                <p className="text-muted-foreground">
                  {companySetting(settings, 'company_country') || t('Country')} -{' '}
                  {companySetting(settings, 'company_zipcode') || '—'}
                </p>
                {companySetting(settings, 'company_telephone') ? (
                  <p className="text-muted-foreground">
                    {t('Phone')}: {companySetting(settings, 'company_telephone')}
                  </p>
                ) : null}
                {companySetting(settings, 'company_email') ? (
                  <p className="text-muted-foreground">
                    {t('Email')}: {companySetting(settings, 'company_email')}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">{t('CUSTOMER')}</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{data.customer?.name ?? t('Walk-in Customer')}</p>
                <p className="text-muted-foreground">{data.customer?.email ?? '—'}</p>
                {data.customer?.mobile_no ? (
                  <p className="text-muted-foreground">{data.customer.mobile_no}</p>
                ) : null}
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium">{t('Depot')}</p>
                <p className="text-sm text-muted-foreground">{data.depot?.name ?? '—'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">{t('DETAILS')}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('Sale Date')}</span>
                  <span>{formatDate(data.created_at ?? data.pos_date)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('Items')}</span>
                  <span>{items.length}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Number.isFinite(saleId) ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to={paths.pos.print(saleId)} target="_blank" rel="noreferrer">
                      <Printer className="mr-1 h-4 w-4" />
                      {t('Print')}
                    </Link>
                  </Button>
                ) : null}
                {data.status?.toLowerCase() === 'pending' && Number.isFinite(saleId) ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to={paths.pos.edit(saleId)}>{t('Edit')}</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm">
                  <Link to={paths.pos.orders}>{t('Back')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Sale Items')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3">{t('Product')}</th>
                  <th className="p-3 text-right">{t('Qty')}</th>
                  <th className="p-3 text-right">{t('Unit Price')}</th>
                  <th className="p-3 text-right">{t('Tax')}</th>
                  <th className="p-3 text-right">{t('Tax Amount')}</th>
                  <th className="p-3 text-right">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">
                      <p className="font-medium">{item.product?.name ?? `#${item.product_id}`}</p>
                      {item.product?.sku ? (
                        <p className="text-xs text-muted-foreground">
                          {t('SKU:')} {item.product.sku}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(Number(item.price))}</td>
                    <td className="p-3 text-right">
                      {item.taxes && item.taxes.length > 0 ? (
                        <div className="flex flex-wrap justify-end gap-1">
                          {item.taxes.map((tax) => (
                            <Badge key={tax.id} variant="outline" className="text-xs">
                              {tax.tax_name} ({tax.rate}%)
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {Number(item.tax_amount) > 0
                        ? formatCurrency(Number(item.tax_amount))
                        : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatCurrency(Number(item.total_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <PosSaleTotals sale={data} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
