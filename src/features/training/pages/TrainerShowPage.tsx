import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getTrainer } from '../training-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function TrainerShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: trainer, isLoading } = useQuery({
    queryKey: ['training', 'trainers', id],
    queryFn: () => getTrainer(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: trainer?.name ?? t('Trainer'),
    breadcrumbs: [
      { label: t('Trainers'), url: paths.training.trainers },
      { label: trainer?.name ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!trainer) return <p className="text-sm text-destructive">{t('Trainer not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{trainer.name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.training.trainerEdit(trainer.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.training.trainers}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Email')}:</span> {trainer.email ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Contact')}:</span> {trainer.contact ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Experience')}:</span> {trainer.experience ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Trainings')}:</span> {trainer.trainings_count ?? 0}
          </p>
          {trainer.expertise ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{trainer.expertise}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
