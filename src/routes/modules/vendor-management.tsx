import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { VendorsIndexPage } from '@/features/vendor-management/pages/VendorsIndexPage'
import { VendorFormPage, VendorShowPage } from '@/features/vendor-management/pages/VendorFormPage'
import { TendersIndexPage } from '@/features/vendor-management/pages/TendersIndexPage'
import { TenderWizardPage } from '@/features/vendor-management/pages/TenderWizardPage'
import { TenderShowPage } from '@/features/vendor-management/pages/TenderShowPage'

export const vendorManagementRoutes = (
  <>
    <Route path={paths.vendorManagement.vendors} element={<VendorsIndexPage />} />
    <Route path={paths.vendorManagement.vendorCreate} element={<VendorFormPage />} />
    <Route path="/vendor-management/vendors/:id/edit" element={<VendorFormPage />} />
    <Route path="/vendor-management/vendors/:id" element={<VendorShowPage />} />
    <Route path={paths.vendorManagement.tenders} element={<TendersIndexPage />} />
    <Route path={paths.vendorManagement.tenderCreate} element={<TenderWizardPage />} />
    <Route path="/vendor-management/tenders/:id/edit" element={<TenderWizardPage />} />
    <Route path="/vendor-management/tenders/:id" element={<TenderShowPage />} />
  </>
)
