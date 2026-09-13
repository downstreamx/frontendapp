import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { candidateFullName } from '../recruitment-candidates-api'
import { getOffer } from '../recruitment-offers-api'

export function OfferShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'offers', id],
    queryFn: () => getOffer(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: offer?.position ?? t('Offer'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Offers'), url: paths.recruitment.offers },
      { label: offer?.position ?? `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (error || !offer) return <p className="text-sm text-destructive">{t('Offer not found.')}</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{offer.position}</h1>
          <FleetStatusBadge status={offer.status ?? 'Draft'} />
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.recruitment.offerEdit(offer.id)}>{t('Edit')}</Link>
          </Button>
          <Link to={paths.recruitment.offers} className="text-sm text-primary hover:underline">
            {t('Back to offers')}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Candidate')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {offer.candidate ? (
              <Link to={paths.recruitment.candidateShow(offer.candidate.id)} className="font-medium text-primary hover:underline">
                {candidateFullName(offer.candidate)}
              </Link>
            ) : (
              '—'
            )}
            <p className="text-muted-foreground">{offer.candidate?.email ?? '—'}</p>
            <p>
              <span className="text-muted-foreground">{t('Job')}: </span>
              {offer.job?.title ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Compensation')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">{t('Salary')}: </span>
              {offer.salary != null ? formatCurrency(Number(offer.salary)) : '—'}
            </p>
            {offer.bonus != null ? (
              <p>
                <span className="text-muted-foreground">{t('Bonus')}: </span>
                {formatCurrency(Number(offer.bonus))}
              </p>
            ) : null}
            {offer.equity ? (
              <p>
                <span className="text-muted-foreground">{t('Equity')}: </span>
                {offer.equity}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('Terms')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">{t('Offer date')}: </span>
              {offer.offer_date ? formatDate(offer.offer_date) : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Start date')}: </span>
              {offer.start_date ? formatDate(offer.start_date) : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Expiration date')}: </span>
              {offer.expiration_date ? formatDate(offer.expiration_date) : '—'}
            </p>
            {offer.benefits ? (
              <div>
                <p className="text-muted-foreground">{t('Benefits')}</p>
                <p className="whitespace-pre-wrap">{offer.benefits}</p>
              </div>
            ) : null}
            {offer.decline_reason ? (
              <p>
                <span className="text-muted-foreground">{t('Decline reason')}: </span>
                {offer.decline_reason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
