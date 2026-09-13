import { Navigate, Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { UsersIndexPage } from '@/features/admin/pages/UsersIndexPage'
import { UserChangePasswordPage } from '@/features/admin/pages/UserChangePasswordPage'
import { UserLoginHistoryPage } from '@/features/admin/pages/UserLoginHistoryPage'
import { RolesIndexPage } from '@/features/admin/pages/RolesIndexPage'
import { RoleFormPage } from '@/features/admin/pages/RoleFormPage'
import { EmailTemplatesIndexPage } from '@/features/templates/pages/EmailTemplatesIndexPage'
import { EmailTemplateEditPage } from '@/features/templates/pages/EmailTemplateEditPage'
import { NotificationTemplatesIndexPage } from '@/features/templates/pages/NotificationTemplatesIndexPage'
import { NotificationTemplateEditPage } from '@/features/templates/pages/NotificationTemplateEditPage'
import { MediaLibraryPage } from '@/features/media/pages/MediaLibraryPage'
import { PlansIndexPage } from '@/features/plans/pages/PlansIndexPage'
import { PlanFormPage } from '@/features/plans/pages/PlanFormPage'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { HelpdeskTicketsIndexPage } from '@/features/helpdesk/pages/HelpdeskTicketsIndexPage'
import { HelpdeskTicketFormPage } from '@/features/helpdesk/pages/HelpdeskTicketFormPage'
import { HelpdeskTicketThreadPage } from '@/features/helpdesk/pages/HelpdeskTicketThreadPage'
import { HelpdeskCategoriesIndexPage } from '@/features/helpdesk/pages/HelpdeskCategoriesIndexPage'
import { HelpdeskCategoryFormPage } from '@/features/helpdesk/pages/HelpdeskCategoryFormPage'
import { HelpdeskCategoryShowPage } from '@/features/helpdesk/pages/HelpdeskCategoryShowPage'
import { MessengerPage } from '@/features/messenger/pages/MessengerPage'
import { CouponFormPage } from '@/features/coupons/pages/CouponFormPage'
import { CouponShowPage } from '@/features/coupons/pages/CouponShowPage'
import { CouponsIndexPage } from '@/features/coupons/pages/CouponsIndexPage'
import { OrdersIndexPage } from '@/features/orders/pages/OrdersIndexPage'
import { OrderFormPage } from '@/features/orders/pages/OrderFormPage'
import { ModulesIndexPage } from '@/features/modules/pages/ModulesIndexPage'
import { SubscriptionIndexPage } from '@/features/saas/pages/SubscriptionIndexPage'
import { PlanShowPage } from '@/features/plans/pages/PlanShowPage'
import { SubscribePlanPage } from '@/features/plans/pages/SubscribePlanPage'
import { OrderShowPage } from '@/features/orders/pages/OrderShowPage'
import { BankTransferPaymentsIndexPage } from '@/features/bank-transfer/pages/BankTransferPaymentsIndexPage'
import { BillingOverviewPage } from '@/features/billing/pages/BillingOverviewPage'
import { CompanyProvisioningAdminPage } from '@/features/admin/pages/CompanyProvisioningAdminPage'

export const platformRoutes = (
  <>
    <Route path={paths.profile} element={<ProfilePage />} />
    <Route path={paths.settings} element={<SettingsPage />} />
    <Route path={paths.users.index} element={<UsersIndexPage />} />
    <Route path={paths.users.create} element={<Navigate to={paths.users.index} replace />} />
    <Route path="/users/:id/edit" element={<Navigate to={paths.users.index} replace />} />
    <Route path="/users/:userId/provisioning" element={<CompanyProvisioningAdminPage />} />
    <Route path="/users/:id/change-password" element={<UserChangePasswordPage />} />
    <Route path={paths.users.loginHistory} element={<UserLoginHistoryPage />} />
    <Route path={paths.roles.index} element={<RolesIndexPage />} />
    <Route path={paths.roles.create} element={<RoleFormPage />} />
    <Route path="/roles/:id/edit" element={<RoleFormPage />} />
    <Route path="/email-templates" element={<EmailTemplatesIndexPage />} />
    <Route path="/email-templates/:id/edit" element={<EmailTemplateEditPage />} />
    <Route path={paths.notificationTemplates} element={<NotificationTemplatesIndexPage />} />
    <Route path="/notification-templates/:id/edit" element={<NotificationTemplateEditPage />} />
    <Route path={paths.media} element={<MediaLibraryPage />} />
    <Route path={paths.plans} element={<PlansIndexPage />} />
    <Route path={paths.planCreate} element={<PlanFormPage />} />
    <Route path="/plans/:id/edit" element={<PlanFormPage />} />
    <Route path="/plans/:id" element={<PlanShowPage />} />
    <Route path="/plans/:planId/subscribe" element={<SubscribePlanPage />} />
    <Route path={paths.billing} element={<BillingOverviewPage />} />
    <Route path={paths.subscription} element={<SubscriptionIndexPage />} />
    <Route path={paths.helpdesk} element={<HelpdeskTicketsIndexPage />} />
    <Route path={paths.helpdeskTicketCreate} element={<HelpdeskTicketFormPage />} />
    <Route path="/helpdesk/tickets/:id" element={<HelpdeskTicketThreadPage />} />
    <Route path={paths.helpdeskCategories} element={<HelpdeskCategoriesIndexPage />} />
    <Route path={paths.helpdeskCategoryCreate} element={<HelpdeskCategoryFormPage />} />
    <Route path="/helpdesk/categories/:id/edit" element={<HelpdeskCategoryFormPage />} />
    <Route path="/helpdesk/categories/:id" element={<HelpdeskCategoryShowPage />} />
    <Route path="/helpdesk/*" element={<ModuleIndexPage />} />
    <Route path="/messenger" element={<MessengerPage />} />
    <Route path={paths.coupons} element={<CouponsIndexPage />} />
    <Route path={paths.couponCreate} element={<CouponFormPage />} />
    <Route path="/coupons/:id/edit" element={<CouponFormPage />} />
    <Route path="/coupons/:id" element={<CouponShowPage />} />
    <Route path={paths.orders} element={<OrdersIndexPage />} />
    <Route path={paths.orderCreate} element={<OrderFormPage />} />
    <Route path="/orders/:id" element={<OrderShowPage />} />
    <Route path="/modules" element={<ModulesIndexPage />} />
    <Route path="/add-ons" element={<Navigate to="/modules" replace />} />
    <Route path="/bank-transfer" element={<BankTransferPaymentsIndexPage />} />
  </>
)
