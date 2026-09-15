import iconAccounting from '@/assets/nav-icons/icons-accounting.png'
import iconAddons from '@/assets/nav-icons/icons-addons.png'
import iconAssets from '@/assets/nav-icons/icons-assets.png'
import iconCalendar from '@/assets/nav-icons/icons-calendar.png'
import iconDashboard from '@/assets/nav-icons/icons-dashboard.png'
import iconDepots from '@/assets/nav-icons/icons-depots.png'
import iconDistribution from '@/assets/nav-icons/icons-distribution.png'
import iconEmail from '@/assets/nav-icons/icons-email.png'
import iconFleet from '@/assets/nav-icons/icons-fleet.png'
import iconForms from '@/assets/nav-icons/icons-forms.png'
import iconHelpdesk from '@/assets/nav-icons/icons-helpdesk.png'
import iconHr from '@/assets/nav-icons/icons-hr.png'
import iconInventory from '@/assets/nav-icons/icons-inventory.png'
import iconMedia from '@/assets/nav-icons/icons-media.png'
import iconMessenger from '@/assets/nav-icons/icons-messenger.png'
import iconNotifications from '@/assets/nav-icons/icons-notifications.png'
import iconPos from '@/assets/nav-icons/icons-pos.png'
import iconProcurement from '@/assets/nav-icons/icons-procurement.png'
import iconProjects from '@/assets/nav-icons/icons-projects.png'
import iconReports from '@/assets/nav-icons/icons-reports.png'
import iconSales from '@/assets/nav-icons/icons-sales.png'
import iconSettings from '@/assets/nav-icons/icons-settings.png'
import iconSubscriptions from '@/assets/nav-icons/icons-subscriptions.png'
import iconTickets from '@/assets/nav-icons/icons-tickets.png'
import iconUsers from '@/assets/nav-icons/icons-users.png'

/** Top-level mega menu nav icons keyed by menu permission. */
export const MEGA_MENU_NAV_ICON_BY_PERMISSION: Record<string, string> = {
  'manage-dashboard': iconDashboard,
  'manage-product-service-item': iconInventory,
  'manage-customers': iconSales,
  'manage-purchase-invoices': iconProcurement,
  'manage-fleet': iconFleet,
  'manage-assets': iconAssets,
  'manage-distribution': iconDistribution,
  'manage-depots': iconDepots,
  'manage-account': iconAccounting,
  'manage-users': iconUsers,
  'manage-hrm': iconHr,
  'manage-pos': iconPos,
  'manage-project': iconProjects,
  'manage-double-entry': iconReports,
  'manage-messenger': iconMessenger,
  'manage-calendar': iconCalendar,
  'manage-media': iconMedia,
  'manage-support-tickets': iconTickets,
  'manage-helpdesk-tickets': iconHelpdesk,
  'manage-formbuilder': iconForms,
  'manage-plans': iconSubscriptions,
  'manage-email-templates': iconEmail,
  'manage-notification-templates': iconNotifications,
  'manage-add-on': iconAddons,
  'manage-settings': iconSettings,
}

export function resolveMegaMenuNavIconSrc(item: { permission?: string }): string | null {
  if (!item.permission) {
    return null
  }

  return MEGA_MENU_NAV_ICON_BY_PERMISSION[item.permission] ?? null
}
