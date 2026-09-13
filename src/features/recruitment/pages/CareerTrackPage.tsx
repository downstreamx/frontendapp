import { FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchTrackingStatus, verifyTracking } from '../careers-public-api'

export function CareerTrackPage() {
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const initialTracking = searchParams.get('tracking_id') ?? ''
  const { t } = useTranslation()

  const [trackingId, setTrackingId] = useState(initialTracking)
  const [email, setEmail] = useState('')
  const [verifiedId, setVerifiedId] = useState(initialTracking)

  const verifyMutation = useMutation({
    mutationFn: () => verifyTracking(slug, trackingId, email),
    onSuccess: (data) => setVerifiedId(data.tracking_id),
  })

  const statusQuery = useQuery({
    queryKey: ['careers', slug, 'track', verifiedId],
    queryFn: () => fetchTrackingStatus(slug, verifiedId),
    enabled: Boolean(slug && verifiedId),
  })

  const onVerify = (e: FormEvent) => {
    e.preventDefault()
    verifyMutation.mutate()
  }

  if (!slug) {
    return <p className="p-4 text-sm text-muted-foreground">{t('Missing company slug.')}</p>
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 p-4">
      <Link to={`/careers?slug=${encodeURIComponent(slug)}`} className="text-sm text-primary hover:underline">
        {t('Back to careers')}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t('Track your application')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onVerify}>
            <div className="space-y-1">
              <Label>{t('Tracking ID')}</Label>
              <Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={verifyMutation.isPending}>
              {t('View status')}
            </Button>
          </form>

          {statusQuery.data && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-medium">{statusQuery.data.candidate.name}</p>
              <p>
                {t('Status')}: {statusQuery.data.candidate.status_label}
              </p>
              {statusQuery.data.candidate.job_title ? (
                <p>
                  {t('Position')}: {statusQuery.data.candidate.job_title}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
