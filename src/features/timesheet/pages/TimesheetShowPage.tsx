import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getTimesheet } from '../timesheet-api'

export function TimesheetShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: timesheet, isLoading } = useQuery({
    queryKey: ['timesheet', 'timesheets', id],
    queryFn: () => getTimesheet(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: timesheet ? `${t('Timesheet')} #${timesheet.id}` : t('Timesheet'),
    breadcrumbs: [
      { label: t('Timesheets'), url: paths.timesheet.index },
      { label: timesheet ? `#${timesheet.id}` : `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!timesheet) return <p className="text-sm text-destructive">{t('Timesheet not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          {t('Timesheet')} #{timesheet.id}
        </h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.timesheet.edit(timesheet.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.timesheet.index}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('User')}:</span> {timesheet.user?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Project')}:</span> {timesheet.project?.name ?? timesheet.project_id ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Date')}:</span>{' '}
            {timesheet.date ? formatDate(timesheet.date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('Type')}:</span> {timesheet.type ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Hours')}:</span> {timesheet.hours ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Minutes')}:</span> {timesheet.minutes ?? '—'}
          </p>
          {timesheet.notes ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{timesheet.notes}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
