import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Fuel, Truck, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchFleetDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'

export function FleetDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Fleet Dashboard'), t('Fleet'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'fleet'],
    queryFn: fetchFleetDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load fleet dashboard.')} />

  const stats = data.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardMetricCard
          title={t('Total trucks')}
          value={stats.total_trucks ?? 0}
          variant="blue"
          icon={Truck}
          href={paths.fleet.trucks}
        />
        <DashboardMetricCard
          title={t('Active trucks')}
          value={stats.active_trucks ?? 0}
          variant="green"
          icon={Truck}
        />
        <DashboardMetricCard
          title={t('Trips in progress')}
          value={stats.trips_in_progress ?? 0}
          variant="orange"
          href={paths.fleet.truckTrips}
        />
        <DashboardMetricCard
          title={t('Scheduled maintenances')}
          value={stats.scheduled_maintenances ?? 0}
          variant="purple"
          icon={Wrench}
          href={paths.fleet.truckMaintenances}
        />
        <DashboardMetricCard
          title={t('Fuel logs this month')}
          value={stats.fuel_logs_this_month ?? 0}
          variant="teal"
          icon={Fuel}
          href={paths.fleet.truckFuelLogs}
        />
        <DashboardMetricCard
          title={t('Active drivers')}
          value={stats.total_drivers ?? 0}
          variant="slate"
          href={paths.fleet.drivers}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Trucks'), href: paths.fleet.trucks },
          { label: t('Drivers'), href: paths.fleet.drivers },
          { label: t('Trips'), href: paths.fleet.truckTrips },
          { label: t('Fuel logs'), href: paths.fleet.truckFuelLogs },
          { label: t('Maintenances'), href: paths.fleet.truckMaintenances },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent trips')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {data.recent_trips.map((trip) => (
                <li key={trip.id} className="flex items-center justify-between gap-2 py-2">
                  <Link
                    to={`${paths.fleet.truckTrips}?highlight=${trip.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {trip.label}
                  </Link>
                  {trip.status ? <FleetStatusBadge status={trip.status} /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent maintenances')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {data.recent_maintenances.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <Link
                    to={paths.fleet.truckMaintenances}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.label}
                  </Link>
                  {row.status ? <FleetStatusBadge status={row.status} /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
