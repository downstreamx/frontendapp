import { Navigate, Route } from 'react-router-dom'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { PosDashboardPage } from '@/features/pos/pages/PosDashboardPage'
import { PosOrdersIndexPage } from '@/features/pos/pages/PosOrdersIndexPage'
import { PosFormPage } from '@/features/pos/pages/PosFormPage'
import { PosTerminalPage } from '@/features/pos/pages/PosTerminalPage'
import { PosPrintPage } from '@/features/pos/pages/PosPrintPage'
import { PosShowPage } from '@/features/pos/pages/PosShowPage'
import { QuotationsIndexPage } from '@/features/quotation/pages/QuotationsIndexPage'
import { QuotationEditorPage } from '@/features/quotation/pages/QuotationEditorPage'
import { QuotationPrintPage } from '@/features/quotation/pages/QuotationPrintPage'
import { QuotationShowPage } from '@/features/quotation/pages/QuotationShowPage'
import { PosBarcodePage } from '@/features/pos/pages/PosBarcodePage'
import { PosReportsPage } from '@/features/pos/pages/PosReportsPage'
import { FormsIndexPage } from '@/features/form-builder/pages/FormsIndexPage'
import { FormBuilderPage } from '@/features/form-builder/pages/FormBuilderPage'
import { CustomPageFormPage } from '@/features/landing-page/pages/CustomPageFormPage'
import { CustomPageShowPage } from '@/features/landing-page/pages/CustomPageShowPage'
import { CustomPagesIndexPage } from '@/features/landing-page/pages/CustomPagesIndexPage'
import { LandingPageEditorPage } from '@/features/landing-page/pages/LandingPageEditorPage'
import { MarketplaceSettingsPage } from '@/features/marketplace/pages/MarketplaceSettingsPage'
import { ContractsIndexPage } from '@/features/contract/pages/ContractsIndexPage'
import { ContractFormPage } from '@/features/contract/pages/ContractFormPage'
import { ContractShowPage } from '@/features/contract/pages/ContractShowPage'
import { paths } from '@/lib/paths'
import { GoalsIndexPage } from '@/features/goal/pages/GoalsIndexPage'
import { GoalFormPage } from '@/features/goal/pages/GoalFormPage'
import { GoalShowPage } from '@/features/goal/pages/GoalShowPage'
import { CalendarIndexPage } from '@/features/calendar/pages/CalendarIndexPage'
import { NewsletterSubscribersIndexPage } from '@/features/landing-page/pages/NewsletterSubscribersIndexPage'

export const opsRoutes = (
  <>
    <Route path={paths.pos.reportsSales} element={<PosReportsPage />} />
    <Route path={paths.pos.reportsProducts} element={<PosReportsPage />} />
    <Route path={paths.pos.reportsCustomers} element={<PosReportsPage />} />
    <Route
      path={paths.pos.reports}
      element={<Navigate to={paths.pos.reportsSales} replace />}
    />
    <Route path={paths.pos.orders} element={<PosOrdersIndexPage />} />
    <Route path={paths.pos.create} element={<PosTerminalPage />} />
    <Route path={paths.pos.barcode} element={<PosBarcodePage />} />
    <Route path="/pos/:id/print" element={<PosPrintPage />} />
    <Route path="/pos/:id/edit" element={<PosFormPage />} />
    <Route path="/pos/:id" element={<PosShowPage />} />
    <Route path={paths.pos.index} element={<PosDashboardPage />} />
    <Route path="/quotation/quotations" element={<QuotationsIndexPage />} />
    <Route path="/quotation/quotations/create" element={<QuotationEditorPage />} />
    <Route path="/quotation/quotations/:id/edit" element={<QuotationEditorPage />} />
    <Route path="/quotation/quotations/:id/print" element={<QuotationPrintPage />} />
    <Route path="/quotation/quotations/:id" element={<QuotationShowPage />} />
    <Route path="/form-builder/forms" element={<FormsIndexPage />} />
    <Route path="/form-builder/forms/:id" element={<FormBuilderPage />} />
    <Route path="/landing-page" element={<LandingPageEditorPage />} />
    <Route path={paths.landingPagePages} element={<CustomPagesIndexPage />} />
    <Route path={paths.landingPagePageCreate} element={<CustomPageFormPage />} />
    <Route path="/landing-page/pages/:id/edit" element={<CustomPageFormPage />} />
    <Route path="/landing-page/pages/:id" element={<CustomPageShowPage />} />
    <Route path="/landing-page/marketplace/settings" element={<MarketplaceSettingsPage />} />
    <Route
      path="/landing-page/newsletter-subscribers"
      element={<NewsletterSubscribersIndexPage />}
    />
    <Route path="/contract" element={<ContractsIndexPage />} />
    <Route path={paths.contract.create} element={<ContractFormPage />} />
    <Route path="/contract/:id/edit" element={<ContractFormPage />} />
    <Route path="/contract/:id" element={<ContractShowPage />} />
    <Route path="/goal" element={<GoalsIndexPage />} />
    <Route path={paths.goal.create} element={<GoalFormPage />} />
    <Route path="/goal/:id/edit" element={<GoalFormPage />} />
    <Route path="/goal/:id" element={<GoalShowPage />} />
    <Route path="/calendar" element={<CalendarIndexPage />} />
    <Route path="/quotation/*" element={<ModuleIndexPage />} />
    <Route path="/form-builder/*" element={<ModuleIndexPage />} />
    <Route path="/landing-page/*" element={<ModuleIndexPage />} />
  </>
)
