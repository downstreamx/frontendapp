import { Navigate, Route, useParams } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { ClientPortalGuard } from '@/routes/ClientPortalGuard'
import { PortalDashboardPage } from '@/features/portal/pages/PortalDashboardPage'
import { PortalInvoicesIndexPage } from '@/features/portal/pages/PortalInvoicesIndexPage'
import { PortalInvoiceViewPage } from '@/features/portal/pages/PortalInvoiceViewPage'
import { PortalDistributionReportPage } from '@/features/portal/pages/PortalDistributionReportPage'

function LegacyBridgingTimelineRedirect() {
  const { id } = useParams()
  return <Navigate to={paths.portal.invoiceShow(id ?? '')} replace />
}

export const portalRoutes = (
  <Route element={<ClientPortalGuard />}>
    <Route path={paths.portal.dashboard} element={<PortalDashboardPage />} />
    <Route path={paths.portal.invoices} element={<PortalInvoicesIndexPage />} />
    <Route path="/portal/invoices/:id" element={<PortalInvoiceViewPage />} />
    <Route path={paths.portal.distributionReport} element={<PortalDistributionReportPage />} />
    <Route
      path="/portal/bridging-report"
      element={<Navigate to={paths.portal.distributionReport} replace />}
    />
    <Route
      path="/portal/invoices/:id/bridging-timeline"
      element={<LegacyBridgingTimelineRedirect />}
    />
  </Route>
)
