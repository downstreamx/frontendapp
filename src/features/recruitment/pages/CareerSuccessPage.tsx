import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CareerSuccessPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const trackingId = searchParams.get('tracking_id') ?? ''

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('Application received')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{t('Thank you for applying. Save your tracking ID to check status later.')}</p>
          {trackingId ? (
            <p className="font-mono text-base font-semibold">{trackingId}</p>
          ) : null}
          {slug && trackingId ? (
            <Link
              to={`/careers/track?slug=${encodeURIComponent(slug)}&tracking_id=${encodeURIComponent(trackingId)}`}
              className="text-primary hover:underline"
            >
              {t('Track application')}
            </Link>
          ) : null}
          {slug ? (
            <Link to={`/careers?slug=${encodeURIComponent(slug)}`} className="text-primary hover:underline block">
              {t('Back to careers')}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
