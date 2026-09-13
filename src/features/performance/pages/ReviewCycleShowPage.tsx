import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getReviewCycle } from '../performance-api'

export function ReviewCycleShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: reviewCycle, isLoading } = useQuery({
    queryKey: ['performance', 'review-cycles', id],
    queryFn: () => getReviewCycle(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: reviewCycle?.name ?? t('Review cycle'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Review cycles'), url: paths.performance.reviewCycles },
      { label: reviewCycle?.name ?? `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!reviewCycle) return <p className="text-sm text-destructive">{t('Review cycle not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{reviewCycle.name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.performance.reviewCycleEdit(reviewCycle.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.performance.reviewCycles}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {reviewCycle.status ? <FleetStatusBadge status={reviewCycle.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Frequency')}:</span> {reviewCycle.frequency ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Reviews')}:</span> {reviewCycle.employee_reviews_count ?? 0}
          </p>
          {reviewCycle.description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{reviewCycle.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
