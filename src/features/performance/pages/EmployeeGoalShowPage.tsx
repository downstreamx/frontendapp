import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getEmployeeGoal } from '../performance-api'

export function EmployeeGoalShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: goal, isLoading } = useQuery({
    queryKey: ['performance', 'employee-goals', id],
    queryFn: () => getEmployeeGoal(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: goal?.title ?? t('Employee goal'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Employee goals'), url: paths.performance.employeeGoals },
      { label: goal?.title ?? `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!goal) return <p className="text-sm text-destructive">{t('Employee goal not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{goal.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.performance.employeeGoalEdit(goal.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.performance.employeeGoals}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {goal.status ? <FleetStatusBadge status={goal.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Employee')}:</span> {goal.employee?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Goal type')}:</span> {goal.goal_type?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Target')}:</span> {goal.target ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Progress')}:</span> {goal.progress ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Start')}:</span>{' '}
            {goal.start_date ? formatDate(goal.start_date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('End')}:</span>{' '}
            {goal.end_date ? formatDate(goal.end_date) : '—'}
          </p>
          {goal.description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{goal.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
