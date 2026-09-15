import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bug, CheckSquare, FolderKanban, UserCheck, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardTeamProgress } from '../components/DashboardTeamProgress'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchProjectDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'

function priorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-500 text-white'
    case 'medium':
      return 'bg-yellow-500 text-white'
    case 'low':
      return 'bg-green-500 text-white'
    default:
      return 'bg-muted text-foreground'
  }
}

export function ProjectDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Project Dashboard'), t('Project'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'project'],
    queryFn: fetchProjectDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load project dashboard.')} />

  const { stats } = data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <DashboardMetricCard
          title={t('Total Projects')}
          value={stats.total_projects}
          subtitle={
            stats.overdue_projects > 0
              ? t('{{count}} overdue', { count: stats.overdue_projects })
              : t('All on track')
          }
          variant="blue"
          icon={FolderKanban}
          href={paths.taskly.projects}
        />
        <DashboardMetricCard
          title={t('Task Completion')}
          value={`${stats.completion_rate}%`}
          subtitle={t('{{done}} / {{total}} completed', {
            done: stats.completed_tasks,
            total: stats.total_tasks,
          })}
          variant="green"
          icon={CheckSquare}
          href={paths.taskly.projects}
        />
        <DashboardMetricCard
          title={t('Active Bugs')}
          value={data.bug_stats.open}
          subtitle={t('{{count}} resolved', { count: data.bug_stats.resolved })}
          variant="red"
          icon={Bug}
        />
        <DashboardMetricCard
          title={t('Team Members')}
          value={stats.total_users}
          subtitle={t('Staff members')}
          variant="purple"
          icon={Users}
          href={paths.users.index}
        />
        <DashboardMetricCard
          title={t('Total Customers')}
          value={stats.total_clients}
          subtitle={t('Active Customers')}
          variant="orange"
          icon={UserCheck}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Projects'), href: paths.taskly.projects },
          { label: t('Create project'), href: paths.taskly.projectCreate },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Company Monthly Progress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardBarChart
            data={data.monthly_progress}
            xAxisKey="month"
            series={[
              { dataKey: 'created', color: '#3b82f6', name: t('Tasks created') },
              { dataKey: 'completed', color: '#10b981', name: t('Tasks completed') },
            ]}
            height={300}
            showLegend
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Project Status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.project_status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Task Priority')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.task_priority} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Team Performance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardTeamProgress members={data.team_performance} completedLabel={t('completed')} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Recent Company Tasks')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('{{done}} of {{total}} tasks completed across all projects', {
              done: stats.completed_tasks,
              total: stats.total_tasks,
            })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.recent_tasks.map((task) => (
              <div key={task.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium">{task.title}</h4>
                  {task.is_completed ? <span className="text-xs text-green-600">✓</span> : null}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('Priority')}</span>
                    <Badge className={priorityClass(task.priority)}>{task.priority}</Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('Stage')}</span>
                    <Badge
                      variant="secondary"
                      style={task.stage_color ? { backgroundColor: task.stage_color, color: '#fff' } : undefined}
                    >
                      {task.stage}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('Assignee')}</span>
                    <span className="font-medium">{task.assignee}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('Project')}</span>
                    <span className="truncate font-medium">{task.project}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
