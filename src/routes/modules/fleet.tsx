import { Navigate, Route, useParams } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { TrucksIndexPage } from '@/features/fleet/pages/TrucksIndexPage'
import { DriversIndexPage } from '@/features/fleet/pages/DriversIndexPage'
import { DriverCreateRedirect } from '@/features/fleet/pages/DriverCreateRedirect'
import { DriverFormPage } from '@/features/fleet/pages/DriverFormPage'
import { DriverViewPage } from '@/features/fleet/pages/DriverViewPage'
import { DriverAssignmentsIndexPage } from '@/features/fleet/pages/DriverAssignmentsIndexPage'
import { TruckProvidersIndexPage } from '@/features/fleet/pages/TruckProvidersIndexPage'
import { MaintenanceProvidersIndexPage } from '@/features/fleet/pages/MaintenanceProvidersIndexPage'
import { TruckMaintenancesIndexPage } from '@/features/fleet/pages/TruckMaintenancesIndexPage'
import {
  MaintenanceProviderViewPage,
  TruckProviderViewPage,
} from '@/features/fleet/pages/FleetProviderViewPage'
import { TruckMaintenanceViewPage } from '@/features/fleet/pages/TruckMaintenanceViewPage'
import { TruckTripsIndexPage } from '@/features/fleet/pages/TruckTripsIndexPage'
import { TruckFuelLogsIndexPage } from '@/features/fleet/pages/TruckFuelLogsIndexPage'
import { TruckMovementsIndexPage } from '@/features/fleet/pages/TruckMovementsIndexPage'
import { FuelTicketsIndexPage } from '@/features/fleet/pages/FuelTicketsIndexPage'
import { TruckTrackerPage } from '@/features/fleet/pages/TruckTrackerPage'
import { TruckProviderPaymentsIndexPage } from '@/features/fleet/pages/TruckProviderPaymentsIndexPage'
import { FleetScheduleListPage } from '@/features/fleet/pages/FleetScheduleListPage'

function FleetTruckViewRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.fleet.trucks}?view=${id}`} replace />
}

function FleetTruckEditRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.fleet.trucks}?edit=${id}`} replace />
}

function FleetTruckProviderEditRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.fleet.truckProviders}?edit=${id}`} replace />
}

function FleetMaintenanceProviderEditRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.fleet.maintenanceProviders}?edit=${id}`} replace />
}

function FleetTruckMaintenanceEditRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.fleet.truckMaintenances}?edit=${id}`} replace />
}

export const fleetRoutes = (
  <>
    <Route path={paths.fleet.trucks} element={<TrucksIndexPage />} />
    <Route path={paths.fleet.truckCreate} element={<Navigate to={`${paths.fleet.trucks}?create=1`} replace />} />
    <Route path="/fleet/trucks/:id/edit" element={<FleetTruckEditRedirect />} />
    <Route path="/fleet/trucks/:id" element={<FleetTruckViewRedirect />} />
    <Route path={paths.fleet.drivers} element={<DriversIndexPage />} />
    <Route path={paths.fleet.driverCreate} element={<DriverCreateRedirect />} />
    <Route path="/fleet/drivers/:id/edit" element={<DriverFormPage />} />
    <Route path="/fleet/drivers/:id" element={<DriverViewPage />} />
    <Route path={paths.fleet.driverAssignments} element={<DriverAssignmentsIndexPage />} />
    <Route path={paths.fleet.truckProviders} element={<TruckProvidersIndexPage />} />
    <Route
      path={paths.fleet.truckProviderCreate}
      element={<Navigate to={`${paths.fleet.truckProviders}?create=1`} replace />}
    />
    <Route path="/fleet/truck-providers/:id/edit" element={<FleetTruckProviderEditRedirect />} />
    <Route path="/fleet/truck-providers/:id" element={<TruckProviderViewPage />} />
    <Route path={paths.fleet.maintenanceProviders} element={<MaintenanceProvidersIndexPage />} />
    <Route
      path={paths.fleet.maintenanceProviderCreate}
      element={<Navigate to={`${paths.fleet.maintenanceProviders}?create=1`} replace />}
    />
    <Route
      path="/fleet/maintenance-providers/:id/edit"
      element={<FleetMaintenanceProviderEditRedirect />}
    />
    <Route path="/fleet/maintenance-providers/:id" element={<MaintenanceProviderViewPage />} />
    <Route path={paths.fleet.truckMaintenances} element={<TruckMaintenancesIndexPage />} />
    <Route
      path={paths.fleet.truckMaintenanceCreate}
      element={<Navigate to={`${paths.fleet.truckMaintenances}?create=1`} replace />}
    />
    <Route path="/fleet/truck-maintenances/:id/edit" element={<FleetTruckMaintenanceEditRedirect />} />
    <Route path="/fleet/truck-maintenances/:id" element={<TruckMaintenanceViewPage />} />
    <Route
      path={paths.fleet.truckLoadingDispatchSchedule}
      element={<FleetScheduleListPage profileKey="fleet-dispatch" />}
    />
    <Route
      path={paths.fleet.truckLoadingArrivalSchedule}
      element={<FleetScheduleListPage profileKey="fleet-arrival" />}
    />
    <Route path={paths.fleet.truckTrips} element={<TruckTripsIndexPage />} />
    <Route path={paths.fleet.truckFuelLogs} element={<TruckFuelLogsIndexPage />} />
    <Route path={paths.fleet.truckMovements} element={<TruckMovementsIndexPage />} />
    <Route path={paths.fleet.fuelTickets} element={<FuelTicketsIndexPage />} />
    <Route path={paths.fleet.truckTracker} element={<TruckTrackerPage />} />
    <Route path={paths.fleet.truckProviderPayments} element={<TruckProviderPaymentsIndexPage />} />
  </>
)
