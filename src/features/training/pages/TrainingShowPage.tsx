import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getTraining } from '../training-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function TrainingShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: training, isLoading } = useQuery({
    queryKey: ['training', 'trainings', id],
    queryFn: () => getTraining(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: training?.title ?? t('Training'),
    breadcrumbs: [
      { label: t('Training'), url: paths.training.index },
      { label: training?.title ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!training) return <p className="text-sm text-destructive">{t('Training not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{training.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.training.edit(training.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.training.index}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {training.status ? <FleetStatusBadge status={training.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Type')}:</span> {training.training_type?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Trainer')}:</span> {training.trainer?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Start')}:</span>{' '}
            {training.start_date ? formatDate(training.start_date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('End')}:</span>{' '}
            {training.end_date ? formatDate(training.end_date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('Location')}:</span> {training.location ?? '—'}
          </p>
          {training.description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{training.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
