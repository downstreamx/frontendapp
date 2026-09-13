import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { FleetDashboardPage } from '@/features/dashboard/pages/FleetDashboardPage'
import { DepotDashboardPage } from '@/features/dashboard/pages/DepotDashboardPage'
import { InventoryDashboardPage } from '@/features/dashboard/pages/InventoryDashboardPage'
import { ProjectDashboardPage } from '@/features/dashboard/pages/ProjectDashboardPage'
import { DistributionDashboardPage } from '@/features/dashboard/pages/DistributionDashboardPage'
import { SupportDashboardPage } from '@/features/dashboard/pages/SupportDashboardPage'

export const dashboardRoutes = (
  <>
    <Route path={paths.dashboards.support} element={<SupportDashboardPage />} />
    <Route path={paths.dashboards.fleet} element={<FleetDashboardPage />} />
    <Route path={paths.dashboards.depot} element={<DepotDashboardPage />} />
    <Route path={paths.dashboards.inventory} element={<InventoryDashboardPage />} />
    <Route path={paths.dashboards.project} element={<ProjectDashboardPage />} />
    <Route path={paths.dashboards.distribution} element={<DistributionDashboardPage />} />
  </>
)
