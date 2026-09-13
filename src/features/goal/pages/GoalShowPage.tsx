import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getGoal } from '../goal-api'

export function GoalShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: goal, isLoading } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => getGoal(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: goal?.goal_name ?? t('Goal'),
    breadcrumbs: [
      { label: t('Goals'), url: paths.goal.index },
      { label: goal?.goal_name ?? `#${id}` },
    ],
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  if (!goal) return <p className="text-sm text-destructive">{t('Goal not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{goal.goal_name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.goal.edit(goal.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.goal.index}>{t('Back')}</Link>
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
          <p><span className="font-medium">{t('Category')}:</span> {goal.category?.category_name ?? '—'}</p>
          <p><span className="font-medium">{t('Type')}:</span> {goal.goal_type}</p>
          <p><span className="font-medium">{t('Target')}:</span> {formatCurrency(Number(goal.target_amount ?? 0))}</p>
          <p><span className="font-medium">{t('Current')}:</span> {formatCurrency(Number(goal.current_amount ?? 0))}</p>
          <p><span className="font-medium">{t('Start')}:</span> {goal.start_date ? formatDate(goal.start_date) : '—'}</p>
          <p><span className="font-medium">{t('Target date')}:</span> {goal.target_date ? formatDate(goal.target_date) : '—'}</p>
          <p><span className="font-medium">{t('Priority')}:</span> {goal.priority}</p>
          {goal.goal_description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{goal.goal_description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
