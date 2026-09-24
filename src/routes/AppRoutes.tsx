import { Navigate, Route, Routes } from 'react-router-dom'
import { DefaultLandingRedirect } from '@/components/default-landing-redirect'
import { NotFoundPage } from '@/components/status-page'
import { paths } from '@/lib/paths'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AccountBeingPreparedPage } from '@/features/auth/pages/AccountBeingPreparedPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { AuthenticatedShell } from '@/routes/AuthenticatedShell'
import { GuestShell } from '@/routes/GuestShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DepotsIndexPage } from '@/features/depots/pages/DepotsIndexPage'
import { DepotRepsIndexPage } from '@/features/depots/pages/DepotRepsIndexPage'
import { DepotRepCreateRedirect } from '@/features/depots/pages/DepotRepCreateRedirect'
import { DepotRepFormPage } from '@/features/depots/pages/DepotRepFormPage'
import { DepotRepViewPage } from '@/features/depots/pages/DepotRepViewPage'
import { DepotRepAssignmentsIndexPage } from '@/features/depots/pages/DepotRepAssignmentsIndexPage'
import { ProductsIndexPage } from '@/features/inventory/pages/ProductsIndexPage'
import { ProductCreatePage } from '@/features/inventory/pages/ProductCreatePage'
import { ProductEditPage } from '@/features/inventory/pages/ProductEditPage'
import { ProductViewPage } from '@/features/inventory/pages/ProductViewPage'
import { StockIndexPage } from '@/features/inventory/pages/StockIndexPage'
import { ReorderLevelsIndexPage } from '@/features/inventory/pages/ReorderLevelsIndexPage'
import { TransfersIndexPage } from '@/features/transfers/pages/TransfersIndexPage'
import { TransferShowPage } from '@/features/transfers/pages/TransferShowPage'
import { commercialRoutes } from '@/routes/modules/commercial'
import { platformRoutes } from '@/routes/modules/platform'
import { fleetRoutes } from '@/routes/modules/fleet'
import { assetManagementRoutes } from '@/routes/modules/asset-management'
import { hrmRoutes } from '@/routes/modules/hrm'
import { accountRoutes } from '@/routes/modules/account'
import { crmRoutes } from '@/routes/modules/crm'
import { opsRoutes } from '@/routes/modules/ops'
import { trainingRoutes } from '@/routes/modules/training'
import { timesheetRoutes } from '@/routes/modules/timesheet'
import { performanceRoutes } from '@/routes/modules/performance'
import { distributionRoutes } from '@/routes/modules/distribution'
import { dashboardRoutes } from '@/routes/modules/dashboards'
import { reportsRoutes } from '@/routes/modules/reports'
import { portalRoutes } from '@/routes/modules/portal'
import { integrationRoutes } from '@/routes/modules/integrations'
import { publicCareerRoutes } from '@/routes/modules/public'
import { vendorManagementRoutes } from '@/routes/modules/vendor-management'
import { inventorySystemSetupRoutes, systemSetupHubRoutes } from '@/routes/modules/system-setup'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestShell />}>
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<Navigate to={paths.login} replace />} />
        <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      {publicCareerRoutes}

      <Route element={<ProtectedRoute />}>
        <Route path={paths.accountBeingPrepared} element={<AccountBeingPreparedPage />} />
        <Route path={paths.onboardingProvisioning} element={<Navigate to={paths.accountBeingPrepared} replace />} />
        <Route element={<AuthenticatedShell />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          {dashboardRoutes}

          {platformRoutes}
          {commercialRoutes}

          {systemSetupHubRoutes}
          {inventorySystemSetupRoutes}

          <Route path={paths.depots.index} element={<DepotsIndexPage />} />
          <Route path={paths.depots.create} element={<Navigate to={paths.depots.index} replace />} />
          <Route path="/depots/:id/edit" element={<Navigate to={paths.depots.index} replace />} />
          <Route path={paths.depots.depotRepAssignments} element={<DepotRepAssignmentsIndexPage />} />
          <Route path={paths.depots.depotReps} element={<DepotRepsIndexPage />} />
          <Route path={paths.depots.depotRepCreate} element={<DepotRepCreateRedirect />} />
          <Route path="/hrm/employees/depot-reps/:id/edit" element={<DepotRepFormPage />} />
          <Route path="/hrm/employees/depot-reps/:id" element={<DepotRepViewPage />} />

          <Route path={paths.inventory.products} element={<ProductsIndexPage />} />
          <Route path={paths.inventory.productCreate} element={<ProductCreatePage />} />
          <Route path="/inventory/products/:id" element={<ProductViewPage />} />
          <Route path="/inventory/products/:id/edit" element={<ProductEditPage />} />
          <Route path={paths.inventory.stock} element={<StockIndexPage />} />
          <Route path={paths.inventory.reorderLevels} element={<ReorderLevelsIndexPage />} />

          <Route path={paths.transfers.index} element={<TransfersIndexPage />} />
          <Route path={paths.transfers.create} element={<Navigate to={paths.transfers.index} replace />} />
          <Route path="/transfers/:id" element={<TransferShowPage />} />

          {fleetRoutes}
          {assetManagementRoutes}
          {vendorManagementRoutes}
          {distributionRoutes}
          {hrmRoutes}
          {accountRoutes}
          {crmRoutes}
          {opsRoutes}
          {trainingRoutes}
          {timesheetRoutes}
          {performanceRoutes}
          {reportsRoutes}
          {portalRoutes}
          {integrationRoutes}

          <Route path="/" element={<DefaultLandingRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.login} replace />} />
    </Routes>
  )
}
