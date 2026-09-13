import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { fetchEmployeeReviewConduct, submitEmployeeReviewConduct } from '../performance-api'

export function EmployeeReviewConductPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const reviewId = Number(id)

  const { data, isLoading } = useQuery({
    queryKey: ['performance', 'employee-reviews', id, 'conduct'],
    queryFn: () => fetchEmployeeReviewConduct(reviewId),
    enabled: Boolean(id),
  })

  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')

  useEffect(() => {
    if (!data) return
    setRatings(data.existing_ratings ?? {})
    setPros(data.review.pros ?? '')
    setCons(data.review.cons ?? '')
  }, [data])

  const review = data?.review
  const categories = data?.performance_indicators_by_category ?? {}

  usePageChrome({
    pageTitle: t('Conduct performance review'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Employee reviews'), url: paths.performance.employeeReviews },
      { label: review?.user?.name ?? `#${id}`, url: review ? paths.performance.employeeReviewShow(review.id) : undefined },
      { label: t('Conduct review') },
    ],
  })

  const mutation = useMutation({
    mutationFn: () =>
      submitEmployeeReviewConduct(reviewId, {
        ratings,
        pros: pros || undefined,
        cons: cons || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['performance', 'employee-reviews'] })
      navigate(paths.performance.employeeReviewShow(reviewId))
    },
  })

  const ratedCount = useMemo(
    () => Object.values(ratings).filter((value) => value > 0).length,
    [ratings],
  )

  const setRating = (indicatorId: number, value: number) => {
    setRatings((prev) => ({ ...prev, [String(indicatorId)]: value }))
  }

  const renderStars = (indicatorId: number) => {
    const current = ratings[String(indicatorId)] ?? 0
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setRating(indicatorId, star)}
            aria-label={t('Rate {{star}} of 5', { star })}
          >
            <Star
              className={`h-6 w-6 ${
                star <= current ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!review) return <p className="text-sm text-destructive">{t('Employee review not found.')}</p>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ratedCount === 0) return
    mutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('Conduct performance review')}</h1>
        <Button asChild size="sm" variant="ghost">
          <Link to={paths.performance.employeeReviews}>{t('Back')}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Review information')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <p>
            <span className="font-medium">{t('Employee')}:</span> {review.user?.name ?? '—'}
          </p>
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
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Performance ratings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(categories).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('No active performance indicators. Add indicators before conducting a review.')}
              </p>
            ) : null}
            {Object.entries(categories).map(([categoryName, indicators]) => (
              <div key={categoryName} className="space-y-3">
                <h3 className="text-base font-semibold">{categoryName || t('Uncategorized')}</h3>
                {indicators.map((indicator) => (
                  <div
                    key={indicator.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4"
                  >
                    <span className="text-sm font-medium">{indicator.name}</span>
                    {renderStars(indicator.id)}
                  </div>
                ))}
              </div>
            ))}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pros">{t('Pros')}</Label>
                <Textarea
                  id="pros"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder={t('Enter positive feedback')}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cons">{t('Cons')}</Label>
                <Textarea
                  id="cons"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder={t('Enter areas for improvement')}
                  rows={4}
                />
              </div>
            </div>

            {ratedCount === 0 && Object.keys(categories).length > 0 ? (
              <p className="text-sm text-destructive">{t('Rate at least one indicator before submitting.')}</p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to={paths.performance.employeeReviewShow(review.id)}>{t('Cancel')}</Link>
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || ratedCount === 0 || Object.keys(categories).length === 0}
              >
                {mutation.isPending ? t('Submitting…') : t('Submit review')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
