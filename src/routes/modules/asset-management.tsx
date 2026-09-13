import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { AssetManagementDashboardPage } from '@/features/asset-management/pages/AssetManagementDashboardPage'
import { AssetsIndexPage } from '@/features/asset-management/pages/AssetsIndexPage'
import { AssetFormPage } from '@/features/asset-management/pages/AssetFormPage'
import { AssetViewPage } from '@/features/asset-management/pages/AssetViewPage'
import { AssetLocationsIndexPage } from '@/features/asset-management/pages/AssetLocationsIndexPage'
import { AssetCategoriesIndexPage } from '@/features/asset-management/pages/AssetCategoriesIndexPage'
import { AssetReportsPage } from '@/features/asset-management/pages/AssetReportsPage'
import { AssetDepreciationPage } from '@/features/asset-management/pages/AssetDepreciationPage'
import { AssetMaintenancePlansIndexPage } from '@/features/asset-management/pages/AssetMaintenancePlansIndexPage'
import { AssetMaintenanceOrdersIndexPage } from '@/features/asset-management/pages/AssetMaintenanceOrdersIndexPage'
import { AssetInspectionsIndexPage } from '@/features/asset-management/pages/AssetInspectionsIndexPage'

export const assetManagementRoutes = (
  <>
    <Route path={paths.assetManagement.dashboard} element={<AssetManagementDashboardPage />} />
    <Route path={paths.assetManagement.assets} element={<AssetsIndexPage />} />
    <Route path={paths.assetManagement.assetCreate} element={<AssetFormPage />} />
    <Route path="/asset-management/assets/:id/edit" element={<AssetFormPage />} />
    <Route path="/asset-management/assets/tag/:tag" element={<AssetViewPage lookupByTag />} />
    <Route path="/asset-management/assets/:id" element={<AssetViewPage />} />
    <Route path={paths.assetManagement.locations} element={<AssetLocationsIndexPage />} />
    <Route path={paths.assetManagement.categories} element={<AssetCategoriesIndexPage />} />
    <Route
      path={paths.assetManagement.maintenancePlans}
      element={<AssetMaintenancePlansIndexPage />}
    />
    <Route
      path={paths.assetManagement.maintenanceOrders}
      element={<AssetMaintenanceOrdersIndexPage />}
    />
    <Route path={paths.assetManagement.inspections} element={<AssetInspectionsIndexPage />} />
    <Route path={paths.assetManagement.reports} element={<AssetReportsPage />} />
    <Route path={paths.assetManagement.depreciation} element={<AssetDepreciationPage />} />
  </>
)
