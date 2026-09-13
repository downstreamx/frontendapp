import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getEmployeeReview } from '../performance-api'

export function EmployeeReviewShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const canConduct = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'conduct-employee-reviews',
  )

  const { data: review, isLoading } = useQuery({
    queryKey: ['performance', 'employee-reviews', id],
    queryFn: () => getEmployeeReview(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: review?.user?.name ?? t('Employee review'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Employee reviews'), url: paths.performance.employeeReviews },
      { label: review?.user?.name ?? `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!review) return <p className="text-sm text-destructive">{t('Employee review not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{review.user?.name ?? t('Employee review')}</h1>
        <div className="flex gap-2">
          {canConduct && review.status !== 'completed' ? (
            <Button asChild size="sm">
              <Link to={paths.performance.employeeReviewConduct(review.id)}>
                <Play className="mr-1 h-4 w-4" />
                {t('Conduct review')}
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link to={paths.performance.employeeReviewEdit(review.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.performance.employeeReviews}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {review.status ? <FleetStatusBadge status={review.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Reviewer')}:</span> {review.reviewer?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Review cycle')}:</span> {review.review_cycle?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Review date')}:</span>{' '}
            {review.review_date ? formatDate(review.review_date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('Completion date')}:</span>{' '}
            {review.completion_date ? formatDate(review.completion_date) : '—'}
          </p>
          {review.average_rating != null ? (
            <p>
              <span className="font-medium">{t('Average rating')}:</span> {review.average_rating}
            </p>
          ) : null}
          {review.pros ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">
              <span className="font-medium">{t('Pros')}:</span> {review.pros}
            </p>
          ) : null}
          {review.cons ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">
              <span className="font-medium">{t('Cons')}:</span> {review.cons}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {review.performance_indicators_by_category &&
      Object.keys(review.performance_indicators_by_category).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('Performance ratings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(review.performance_indicators_by_category).map(([categoryName, indicators]) => (
              <div key={categoryName} className="space-y-3">
                <h3 className="text-base font-semibold">{categoryName || t('Uncategorized')}</h3>
                {indicators.map((indicator) => (
                  <div
                    key={indicator.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <span className="text-sm font-medium">{indicator.name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (indicator.user_rating ?? 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
