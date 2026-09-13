import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Calendar, CheckCircle, Clock, Folder, Ticket, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchSupportDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'
import { formatDateTime } from '@/utils/helpers'

export function SupportDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Support Dashboard'), t('Support'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'support'],
    queryFn: fetchSupportDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load support dashboard.')} />

  const stats = data.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardMetricCard
          title={t('Total tickets')}
          value={stats.total_tickets}
          subtitle={t('All time')}
          variant="blue"
          icon={Ticket}
          href={paths.support.tickets}
        />
        <DashboardMetricCard
          title={t('Open tickets')}
          value={stats.open_tickets}
          subtitle={t('Pending resolution')}
          variant="orange"
          icon={Clock}
          href={paths.support.tickets}
        />
        <DashboardMetricCard
          title={t('Closed tickets')}
          value={stats.closed_tickets}
          subtitle={t('{{rate}}% resolution rate', { rate: stats.resolution_rate })}
          variant="green"
          icon={CheckCircle}
          href={paths.support.tickets}
        />
        <DashboardMetricCard
          title={t("Today's tickets")}
          value={stats.today_tickets}
          subtitle={t('Created today')}
          variant="purple"
          icon={Calendar}
        />
        <DashboardMetricCard
          title={t('Avg response')}
          value={`${stats.avg_response_hours}h`}
          subtitle={t('Response time')}
          variant="teal"
          icon={TrendingUp}
        />
        <DashboardMetricCard
          title={t('Categories')}
          value={stats.categories}
          subtitle={t('Active categories')}
          variant="red"
          icon={Folder}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('All tickets'), href: paths.support.tickets },
          { label: t('Knowledge base'), href: paths.support.knowledgeBase },
          { label: t('FAQs'), href: paths.support.faqs },
          { label: t('Contacts'), href: paths.support.contacts },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">{t('Ticket trends — this year')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={data.monthly_tickets}
              xAxisKey="month"
              series={[{ dataKey: 'tickets', color: '#3b82f6', name: t('Tickets') }]}
              chartType="area"
              height={280}
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">{t('Status distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.status_distribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Tickets by category')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.category_breakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('Recent tickets')}</CardTitle>
            <Link to={paths.support.tickets} className="text-sm font-medium text-primary hover:underline">
              {t('View all')}
            </Link>
          </CardHeader>
          <CardContent>
            {data.recent_tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No recent tickets found.')}</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.recent_tickets.map((ticket) => (
                  <li key={ticket.id} className="py-3">
                    <Link
                      to={`${paths.support.tickets}/${ticket.id}`}
                      className="block rounded-md transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">#{ticket.ticket_id}</span>
                        {ticket.status ? <FleetStatusBadge status={ticket.status} /> : null}
                      </div>
                      <p className="mt-1 font-medium text-foreground">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.name} · {ticket.category} · {formatDateTime(ticket.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
