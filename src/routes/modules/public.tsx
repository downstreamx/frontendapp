import { Route } from 'react-router-dom'
import { PublicLayout } from '@/layouts/public-layout'
import { CareersPage } from '@/features/recruitment/pages/CareersPage'
import { CareerJobPage } from '@/features/recruitment/pages/CareerJobPage'
import { CareerApplyPage } from '@/features/recruitment/pages/CareerApplyPage'
import { CareerTrackPage } from '@/features/recruitment/pages/CareerTrackPage'
import { CareerSuccessPage } from '@/features/recruitment/pages/CareerSuccessPage'
import {
  VendorTenderPortalPage,
  VendorTenderSuccessPage,
} from '@/features/vendor-management/pages/VendorTenderPortalPage'
import { paths } from '@/lib/paths'

export const publicCareerRoutes = (
  <Route element={<PublicLayout />}>
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/careers/jobs/:id/apply" element={<CareerApplyPage />} />
    <Route path="/careers/jobs/:id" element={<CareerJobPage />} />
    <Route path="/careers/track" element={<CareerTrackPage />} />
    <Route path="/careers/success" element={<CareerSuccessPage />} />
    <Route path={paths.vendorTenderSuccess} element={<VendorTenderSuccessPage />} />
    <Route path="/vendor-tenders/:token" element={<VendorTenderPortalPage />} />
  </Route>
)
