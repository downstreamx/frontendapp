import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarView, type CalendarViewEvent } from '@/components/calendar-view'
import { DashboardDistributionBars } from '../components/DashboardDistributionBars'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchHrmDashboard, type HrmDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'

function leaveStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    case 'rejected':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function toCalendarViewEvents(events: HrmDashboard['calendar_events']): CalendarViewEvent[] {
  return events.map((event) => ({
    id: `${event.type}-${event.id}`,
    title: event.title,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    time: event.time,
    description: event.description,
    color: event.color,
    type: event.type,
  }))
}

export function HrmDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('HRM Dashboard'), t('HRM'))

  const [selectedEvent, setSelectedEvent] = useState<CalendarViewEvent | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'hrm'],
    queryFn: fetchHrmDashboard,
  })

  const calendarEvents = useMemo(
    () => (data ? toCalendarViewEvents(data.calendar_events) : []),
    [data],
  )

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load HRM dashboard.')} />

  const stats = data.stats
  const absentDelta = stats.absent_today - stats.absent_yesterday

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total employees')}
          value={stats.total_employees}
          variant="blue"
          icon={Users}
          href={paths.hrm.employees}
        />
        <DashboardMetricCard
          title={t('Present today')}
          value={stats.present_today}
          subtitle={t('{{rate}}% attendance rate', { rate: stats.attendance_rate })}
          variant="green"
          icon={UserCheck}
          href={paths.hrm.attendances}
        />
        <DashboardMetricCard
          title={t('Absent today')}
          value={stats.absent_today}
          subtitle={
            absentDelta === 0
              ? t('Same as yesterday')
              : t('{{delta}} from yesterday', {
                  delta: `${absentDelta > 0 ? '+' : ''}${absentDelta}`,
                })
          }
          variant="red"
          icon={UserX}
          href={paths.hrm.attendances}
        />
        <DashboardMetricCard
          title={t('On leave')}
          value={stats.on_leave}
          subtitle={t('{{count}} pending approvals', { count: stats.pending_leaves })}
          variant="purple"
          icon={Calendar}
          href={paths.hrm.leaveApplications}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total branches')}
          value={stats.total_branches}
          variant="teal"
          icon={Building2}
        />
        <DashboardMetricCard
          title={t('Total departments')}
          value={stats.total_departments}
          variant="purple"
          icon={Briefcase}
        />
        <DashboardMetricCard
          title={t('Promotions this month')}
          value={stats.total_promotions}
          variant="green"
          icon={TrendingUp}
          href={paths.hrm.promotions}
        />
        <DashboardMetricCard
          title={t('Terminations this month')}
          value={stats.terminations}
          variant="red"
          icon={TrendingDown}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Employees'), href: paths.hrm.employees },
          { label: t('Add employee'), href: paths.hrm.employeeCreate },
          { label: t('Attendances'), href: paths.hrm.attendances },
          { label: t('Leave applications'), href: paths.hrm.leaveApplications },
          { label: t('Payrolls'), href: paths.hrm.payrolls },
          { label: t('Holidays'), href: paths.hrm.holidays },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Department distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardDistributionBars items={data.department_distribution} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Employees on leave today')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.employees_on_leave_today.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No employees on leave today.')}</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.employees_on_leave_today.map((row, index) => (
                  <li key={`${row.name}-${index}`} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.leave_type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t('{{days}} days', { days: row.days })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Missing attendance today')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.employees_without_attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('All employees marked attendance.')}</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.employees_without_attendance.map((row) => (
                  <li key={row.employee_id} className="py-2">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.department}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5" />
              {t('Events & holidays calendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No events or holidays scheduled.')}</p>
            ) : (
              <CalendarView events={calendarEvents} onEventClick={setSelectedEvent} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Recent leave applications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {data.recent_leave_applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No recent leave applications.')}</p>
                ) : (
                  data.recent_leave_applications.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {leave.employee_name} · {leave.leave_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.start_date === leave.end_date
                            ? formatDate(leave.start_date)
                            : `${formatDate(leave.start_date)} – ${formatDate(leave.end_date)}`}
                          {' · '}
                          {t('{{days}} days', { days: leave.total_days })}
                        </p>
                      </div>
                      <Badge className={leaveStatusClass(leave.status)}>{leave.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Announcements')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {data.recent_announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No active announcements.')}</p>
                ) : (
                  data.recent_announcements.map((row) => (
                    <div key={row.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{row.title}</p>
                      {row.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{row.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">{t('Type')}:</span>{' '}
                {selectedEvent.type === 'holiday' ? t('Holiday') : t('Event')}
              </p>
              <p>
                <span className="font-medium">{t('Date')}:</span>{' '}
                {selectedEvent.startDate === selectedEvent.endDate
                  ? formatDate(selectedEvent.startDate)
                  : `${formatDate(selectedEvent.startDate)} – ${formatDate(selectedEvent.endDate)}`}
              </p>
              {selectedEvent.time ? (
                <p>
                  <span className="font-medium">{t('Time')}:</span> {selectedEvent.time}
                </p>
              ) : null}
              {selectedEvent.description ? (
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
