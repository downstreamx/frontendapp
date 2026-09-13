import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { DashboardBarChart } from '@/features/dashboard/components/DashboardBarChart'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { route } from '@/lib/route'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { fetchProjectReport } from '../taskly-api'

export function ProjectReportShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['taskly', 'project-report', id],
    queryFn: () => fetchProjectReport(id!),
    enabled: Boolean(id && /^\d+$/.test(id)),
  })

  const project = data?.project
  const stats = data?.project_stats

  usePageChrome({
    pageTitle: project ? `${t('Project Report')}: ${project.name}` : t('Project Report'),
    breadcrumbs: [
      { label: t('Project') },
      { label: t('Project Reports'), url: route('project.report.index') },
      ...(project ? [{ label: project.name }] : []),
    ],
  })

  if (!id || !/^\d+$/.test(id)) {
    return <p className="text-sm text-destructive">{t('Project not found.')}</p>
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data || !project) {
    return <p className="text-sm text-destructive">{t('Project not found.')}</p>
  }

  const completionPct =
    stats && stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0

  const priorityChartData =
    data.task_priority_data?.map((row) => ({
      name: row.name,
      count: row.value,
    })) ?? []

  const statusChartData =
    data.task_status_data?.map((row) => ({
      name: row.name,
      count: row.value,
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={route('project.report.index')}>{t('Back to reports')}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{project.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('Status')}</span>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.start_date && (
              <p>
                <span className="text-muted-foreground">{t('Start Date')}: </span>
                {formatDate(project.start_date)}
              </p>
            )}
            {project.end_date && (
              <p>
                <span className="text-muted-foreground">{t('End Date')}: </span>
                {formatDate(project.end_date)}
              </p>
            )}
            {project.budget != null && project.budget !== '' && (
              <p>
                <span className="text-muted-foreground">{t('Budget')}: </span>
                {formatCurrency(project.budget)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('Tasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {stats?.completed_tasks ?? 0}/{stats?.total_tasks ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">{completionPct}% {t('complete')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('In progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats?.in_progress_tasks ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('Team members')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats?.team_members ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Tasks by stage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={statusChartData}
              xAxisKey="name"
              series={[{ dataKey: 'count', color: '#6366f1', name: t('Tasks') }]}
              chartType="bar"
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Tasks by priority')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={priorityChartData}
              xAxisKey="name"
              series={[{ dataKey: 'count', color: '#10b981', name: t('Tasks') }]}
              chartType="bar"
              height={280}
            />
          </CardContent>
        </Card>
      </div>

      {data.users_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Team workload')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{t('Member')}</th>
                  <th className="p-2 text-right">{t('Assigned')}</th>
                  <th className="p-2 text-right">{t('Done')}</th>
                </tr>
              </thead>
              <tbody>
                {data.users_data.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2 text-right">{user.assigned_tasks}</td>
                    <td className="p-2 text-right">{user.done_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data.milestones_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Milestones')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{t('Name')}</th>
                  <th className="p-2">{t('Status')}</th>
                  <th className="p-2 text-right">{t('Progress')}</th>
                  <th className="p-2 text-right">{t('Cost')}</th>
                </tr>
              </thead>
              <tbody>
                {data.milestones_data.map((milestone) => (
                  <tr key={milestone.id} className="border-b">
                    <td className="p-2">{milestone.name}</td>
                    <td className="p-2">{milestone.status}</td>
                    <td className="p-2 text-right">{milestone.progress}%</td>
                    <td className="p-2 text-right">{formatCurrency(milestone.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
