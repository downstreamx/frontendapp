import { Navigate, Route, useParams } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { SalesOrdersLegacyRedirect } from '@/routes/SalesOrdersLegacyRedirect'
import { CommercialInvoiceEditorPage } from '@/features/commercial/pages/CommercialInvoiceEditorPage'
import { CommercialInvoiceViewPage } from '@/features/commercial/pages/CommercialInvoiceViewPage'
import { SalesInvoicesIndexPage } from '@/features/sales/pages/SalesInvoicesIndexPage'
import { PurchaseInvoicesIndexPage } from '@/features/purchase/pages/PurchaseInvoicesIndexPage'
import { SalesOrdersIndexPage } from '@/features/sales/pages/SalesOrdersIndexPage'
import { SalesOrderEditorPage } from '@/features/sales/pages/SalesOrderEditorPage'
import { SalesOrderViewPage } from '@/features/sales/pages/SalesOrderViewPage'
import { SalesReturnsIndexPage } from '@/features/sales/pages/SalesReturnsIndexPage'
import { SalesReturnEditorPage } from '@/features/sales/pages/SalesReturnEditorPage'
import { SalesReturnViewPage } from '@/features/sales/pages/SalesReturnViewPage'
import { PurchaseReturnsIndexPage } from '@/features/purchase/pages/PurchaseReturnsIndexPage'
import { PurchaseReturnEditorPage } from '@/features/purchase/pages/PurchaseReturnEditorPage'
import { PurchaseReturnViewPage } from '@/features/purchase/pages/PurchaseReturnViewPage'
import { UndistributedSalesIndexPage } from '@/features/bridging/pages/UndistributedSalesIndexPage'
import { UnbridgedPurchasesIndexPage } from '@/features/bridging/pages/UnbridgedPurchasesIndexPage'
import { BridgingsIndexPage } from '@/features/bridging/pages/BridgingsIndexPage'
import { ProcurementBridgingsIndexPage } from '@/features/bridging/pages/ProcurementBridgingsIndexPage'
import { TruckLoadShowPage } from '@/features/bridging/pages/TruckLoadShowPage'
import { SalesDistributionListPage } from '@/features/sales/pages/SalesDistributionListPage'

function LegacyBridgingRecordShowRedirect() {
  const { id } = useParams()
  return <Navigate to={paths.bridging.truckLoadShow(id ?? '')} replace />
}

export const commercialRoutes = (
  <>
    <Route path={paths.sales.invoices} element={<SalesInvoicesIndexPage />} />
    <Route
      path={`${paths.sales.invoices}/create`}
      element={<CommercialInvoiceEditorPage kind="sales" indexPath={paths.sales.invoices} />}
    />
    <Route
      path={`${paths.sales.invoices}/:id/edit`}
      element={<CommercialInvoiceEditorPage kind="sales" indexPath={paths.sales.invoices} />}
    />
    <Route
      path={`${paths.sales.invoices}/:id`}
      element={<CommercialInvoiceViewPage kind="sales" indexPath={paths.sales.invoices} />}
    />

    <Route path={paths.purchase.invoices} element={<PurchaseInvoicesIndexPage />} />
    <Route
      path={`${paths.purchase.invoices}/create`}
      element={<CommercialInvoiceEditorPage kind="purchase" indexPath={paths.purchase.invoices} />}
    />
    <Route
      path={`${paths.purchase.invoices}/:id/edit`}
      element={<CommercialInvoiceEditorPage kind="purchase" indexPath={paths.purchase.invoices} />}
    />
    <Route
      path={`${paths.purchase.invoices}/:id`}
      element={<CommercialInvoiceViewPage kind="purchase" indexPath={paths.purchase.invoices} />}
    />

    <Route path={paths.sales.orders} element={<SalesOrdersIndexPage />} />
    <Route path={paths.sales.orderCreate} element={<SalesOrderEditorPage />} />
    <Route path="/sales/orders/:id/edit" element={<SalesOrderEditorPage />} />
    <Route path="/sales/orders/:id" element={<SalesOrderViewPage />} />
    <Route path="/sales/proposals/*" element={<SalesOrdersLegacyRedirect />} />

    <Route path={paths.sales.returns} element={<SalesReturnsIndexPage />} />
    <Route path={paths.sales.returnCreate} element={<SalesReturnEditorPage />} />
    <Route path="/sales/returns/:id/edit" element={<SalesReturnEditorPage />} />
    <Route path="/sales/returns/:id" element={<SalesReturnViewPage />} />

    <Route path={paths.purchase.returns} element={<PurchaseReturnsIndexPage />} />
    <Route path={paths.purchase.returnCreate} element={<PurchaseReturnEditorPage />} />
    <Route path="/purchase/returns/:id/edit" element={<PurchaseReturnEditorPage />} />
    <Route path="/purchase/returns/:id" element={<PurchaseReturnViewPage />} />

    <Route path={paths.sales.undistributed} element={<UndistributedSalesIndexPage />} />
    <Route
      path={paths.sales.distributions}
      element={
        <SalesDistributionListPage entityKey="loading-schedules" titleKey="List of Distributions" />
      }
    />
    <Route
      path={paths.sales.deliveredDistributions}
      element={
        <SalesDistributionListPage
          entityKey="loading-schedules"
          titleKey="Delivered distributions"
          defaultStatus="in_transit"
        />
      }
    />
    <Route
      path={paths.sales.pendingDelivery}
      element={
        <SalesDistributionListPage
          entityKey="delivery-schedules"
          titleKey="Distribution pending delivery"
          defaultStatus="scheduled"
        />
      }
    />
    <Route
      path={paths.sales.deliveryConfirmations}
      element={
        <SalesDistributionListPage
          entityKey="delivery-confirmations"
          titleKey="Delivery Confirmations"
        />
      }
    />
    <Route
      path={paths.sales.productDeliverySchedule}
      element={
        <SalesDistributionListPage
          entityKey="delivery-schedules"
          titleKey="Product Delivery Schedule"
        />
      }
    />

    <Route path={paths.purchase.unbridged} element={<UnbridgedPurchasesIndexPage />} />
    <Route path={paths.purchase.bridgings} element={<ProcurementBridgingsIndexPage />} />
    <Route path={paths.bridging.index} element={<BridgingsIndexPage />} />
    <Route path="/bridging/truck-loads/:id" element={<TruckLoadShowPage />} />
    <Route
      path="/bridging/bridging-records"
      element={<Navigate to={paths.bridging.index} replace />}
    />
    <Route
      path="/bridging/bridging-records/:id"
      element={<LegacyBridgingRecordShowRedirect />}
    />
  </>
)
