import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import { getAsset, getAssetByTag } from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

type Props = {
  lookupByTag?: boolean
}

export function AssetViewPage({ lookupByTag = false }: Props) {
  const { id, tag } = useParams()
  const { t } = useTranslation()

  const assetQuery = useQuery({
    queryKey: ['asset', lookupByTag ? tag : id],
    queryFn: () => (lookupByTag && tag ? getAssetByTag(tag) : getAsset(id!)),
    enabled: lookupByTag ? Boolean(tag) : Boolean(id),
  })

  const asset = assetQuery.data

  usePageChrome(asset ? `${asset.asset_tag} — ${asset.name}` : t('Asset'), t('Assets'))

  if (assetQuery.isLoading) {
    return <Skeleton className="m-6 h-64 w-full" />
  }

  if (!asset) {
    return <p className="p-6 text-destructive">{t('Asset not found.')}</p>
  }

  const detail = asset as Record<string, unknown>

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={paths.assetManagement.assets}>{t('Back')}</Link>
        </Button>
        <Button asChild size="sm">
          <Link to={paths.assetManagement.assetEdit(asset.id)}>{t('Edit')}</Link>
        </Button>
        <Badge>{asset.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{asset.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">{t('Tag')}:</span> {asset.asset_tag}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Serial')}:</span>{' '}
            {asset.serial_number ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Category')}:</span>{' '}
            {asset.category?.name ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Location')}:</span>{' '}
            {asset.location?.name ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Depot')}:</span>{' '}
            {asset.depot?.name ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Purchase cost')}:</span>{' '}
            {asset.purchase_cost != null ? formatCurrency(asset.purchase_cost) : '—'}
          </p>
        </CardContent>
      </Card>

      {Array.isArray(detail.maintenance_orders) && detail.maintenance_orders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('Recent maintenance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(detail.maintenance_orders as Array<{ order_number: string; title: string; status: string }>).map(
              (mo) => (
                <p key={mo.order_number}>
                  {mo.order_number} — {mo.title} ({mo.status})
                </p>
              ),
            )}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {t('QR link')}: {paths.assetManagement.assetByTag(asset.asset_tag)}
      </p>
    </div>
  )
}
