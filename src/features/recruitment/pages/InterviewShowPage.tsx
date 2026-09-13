import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { candidateFullName } from '../recruitment-candidates-api'
import { getInterview } from '../recruitment-interviews-api'

export function InterviewShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'interviews', id],
    queryFn: () => getInterview(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: interview ? `${candidateFullName(interview.candidate ?? { first_name: '', last_name: '' })} — ${t('Interview')}` : t('Interview'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Interviews'), url: paths.recruitment.interviews },
      { label: interview ? formatDate(interview.scheduled_date) : `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (error || !interview) return <p className="text-sm text-destructive">{t('Interview not found.')}</p>

  const round = interview.interview_round ?? interview.interviewRound
  const type = interview.interview_type ?? interview.interviewType
  const job = interview.job_posting ?? interview.jobPosting

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">
            {interview.candidate ? candidateFullName(interview.candidate) : t('Interview')}
          </h1>
          <FleetStatusBadge status={interview.status ?? 'Scheduled'} />
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.recruitment.interviewEdit(interview.id)}>{t('Edit')}</Link>
          </Button>
          <Link to={paths.recruitment.interviews} className="text-sm text-primary hover:underline">
            {t('Back to interviews')}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Candidate')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {interview.candidate ? (
                <Link to={paths.recruitment.candidateShow(interview.candidate.id)} className="text-primary hover:underline">
                  {candidateFullName(interview.candidate)}
                </Link>
              ) : (
                '—'
              )}
            </p>
            <p className="text-muted-foreground">{interview.candidate?.email ?? '—'}</p>
            <p>
              <span className="text-muted-foreground">{t('Job')}: </span>
              {job?.title ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Schedule')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('Date')}: </span>
              {interview.scheduled_date ? formatDate(interview.scheduled_date) : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Time')}: </span>
              {interview.scheduled_time ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Duration')}: </span>
              {interview.duration != null ? `${interview.duration} min` : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Round')}: </span>
              {round?.name ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('Type')}: </span>
              {type?.name ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('Location & meeting')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('Location')}: </span>
              {interview.location ?? '—'}
            </p>
            {interview.meeting_link ? (
              <p>
                <span className="text-muted-foreground">{t('Meeting link')}: </span>
                <a href={interview.meeting_link} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                  {interview.meeting_link}
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {(interview.interview_feedbacks?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Feedback')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {interview.interview_feedbacks?.map((fb, i) => (
                <li key={String(fb.id ?? i)} className="rounded-md border px-3 py-2">
                  {String(fb.recommendation ?? fb.overall_rating ?? t('Feedback recorded'))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
