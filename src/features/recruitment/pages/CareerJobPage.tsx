import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPublicJob } from '../careers-public-api'

export function CareerJobPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['careers', slug, 'job', id],
    queryFn: () => fetchPublicJob(slug, Number(id)),
    enabled: Boolean(slug && id),
  })

  if (!slug) {
    return <p className="p-4 text-sm text-muted-foreground">{t('Missing company slug.')}</p>
  }

  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">{t('Loading…')}</p>
  if (error || !data) return <p className="p-4 text-sm text-destructive">{t('Job not found.')}</p>

  const job = data.job

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <Link
        to={`/careers?slug=${encodeURIComponent(slug)}`}
        className="text-sm text-primary hover:underline"
      >
        {t('Back to careers')}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {[job.location, job.job_type].filter(Boolean).join(' · ')}
          {job.description ? (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
          ) : null}
          <Button asChild>
            <Link to={`/careers/jobs/${job.id}/apply?slug=${encodeURIComponent(slug)}`}>
              {t('Apply now')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
