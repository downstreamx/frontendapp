import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getIndicator } from '../performance-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function IndicatorShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: indicator, isLoading } = useQuery({
    queryKey: ['performance', 'indicators', id],
    queryFn: () => getIndicator(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: indicator?.name ?? t('Indicator'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Indicators'), url: paths.performance.indicators },
      { label: indicator?.name ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!indicator) return <p className="text-sm text-destructive">{t('Indicator not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{indicator.name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.performance.indicatorEdit(indicator.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.performance.indicators}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {indicator.status ? <FleetStatusBadge status={indicator.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Category')}:</span> {indicator.category?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Measurement unit')}:</span> {indicator.measurement_unit ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Target value')}:</span> {indicator.target_value ?? '—'}
          </p>
          {indicator.description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{indicator.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
