import type { LucideIcon } from 'lucide-react'
import {
  Building,
  Cookie,
  CreditCard,
  DollarSign,
  FileText,
  HardDrive,
  Link2,
  Mail,
  Palette,
  Radio,
  Search,
  Settings as SettingsIcon,
  Shield,
  Trash2,
} from 'lucide-react'

export type SettingMenuItem = {
  order: number
  title: string
  href: string
  icon: LucideIcon
  permission: string
  editPermission: string
  component: string
  tab: string
}

const companyItems = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 10,
    title: t('Brand Settings'),
    href: '#brand-settings',
    icon: Palette,
    permission: 'manage-brand-settings',
    editPermission: 'edit-brand-settings',
    component: 'brand-settings',
    tab: 'Brand',
  },
  {
    order: 20,
    title: t('System Settings'),
    href: '#system-settings',
    icon: SettingsIcon,
    permission: 'manage-system-settings',
    editPermission: 'edit-system-settings',
    component: 'system-settings',
    tab: 'System',
  },
  {
    order: 30,
    title: t('Company Settings'),
    href: '#company-settings',
    icon: Building,
    permission: 'manage-company-settings',
    editPermission: 'edit-company-settings',
    component: 'company-settings',
    tab: 'Company',
  },
  {
    order: 40,
    title: t('Currency Settings'),
    href: '#currency-settings',
    icon: DollarSign,
    permission: 'manage-currency-settings',
    editPermission: 'edit-currency-settings',
    component: 'currency-settings',
    tab: 'Currency',
  },
  {
    order: 500,
    title: t('Email Settings'),
    href: '#email-settings',
    icon: Mail,
    permission: 'manage-email-settings',
    editPermission: 'edit-email-settings',
    component: 'email-settings',
    tab: 'Email',
  },
  {
    order: 510,
    title: t('Email Notification Settings'),
    href: '#email-notification-settings',
    icon: Mail,
    permission: 'manage-email-notification-settings',
    editPermission: 'manage-email-notification-settings',
    component: 'email-notification-settings',
    tab: 'EmailNotification',
  },
  {
    order: 90,
    title: t('Invoice Settings'),
    href: '#invoice-settings',
    icon: FileText,
    permission: 'manage-settings',
    editPermission: 'edit-settings',
    component: 'invoice-settings',
    tab: 'Invoice',
  },
  {
    order: 95,
    title: t('Subscription Settings'),
    href: '#subscription-settings',
    icon: SettingsIcon,
    permission: 'manage-settings',
    editPermission: 'edit-settings',
    component: 'subscription-settings',
    tab: 'Subscription',
  },
  {
    order: 1000,
    title: t('Bank Transfer Settings'),
    href: '#bank-transfer-settings',
    icon: CreditCard,
    permission: 'manage-bank-transfer-settings',
    editPermission: 'edit-bank-transfer-settings',
    component: 'bank-transfer-settings',
    tab: 'Payment',
  },
]

const superAdminItems = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 10,
    title: t('Brand Settings'),
    href: '#brand-settings',
    icon: Palette,
    permission: 'manage-brand-settings',
    editPermission: 'edit-brand-settings',
    component: 'brand-settings',
    tab: 'Brand',
  },
  {
    order: 20,
    title: t('System Settings'),
    href: '#system-settings',
    icon: SettingsIcon,
    permission: 'manage-system-settings',
    editPermission: 'edit-system-settings',
    component: 'system-settings',
    tab: 'System',
  },
  {
    order: 30,
    title: t('Currency Settings'),
    href: '#currency-settings',
    icon: DollarSign,
    permission: 'manage-currency-settings',
    editPermission: 'edit-currency-settings',
    component: 'currency-settings',
    tab: 'Currency',
  },
  {
    order: 40,
    title: t('Cookie Settings'),
    href: '#cookie-settings',
    icon: Cookie,
    permission: 'manage-cookie-settings',
    editPermission: 'edit-cookie-settings',
    component: 'cookie-settings',
    tab: 'Cookie',
  },
  {
    order: 50,
    title: t('Pusher Settings'),
    href: '#pusher-settings',
    icon: Radio,
    permission: 'manage-pusher-settings',
    editPermission: 'edit-pusher-settings',
    component: 'pusher-settings',
    tab: 'Pusher',
  },
  {
    order: 60,
    title: t('SEO Settings'),
    href: '#seo-settings',
    icon: Search,
    permission: 'manage-seo-settings',
    editPermission: 'edit-seo-settings',
    component: 'seo-settings',
    tab: 'SEO',
  },
  {
    order: 70,
    title: t('Cache Settings'),
    href: '#cache-settings',
    icon: Trash2,
    permission: 'manage-cache-settings',
    editPermission: 'edit-cache-settings',
    component: 'cache-settings',
    tab: 'Cache',
  },
  {
    order: 80,
    title: t('Storage Settings'),
    href: '#storage-settings',
    icon: HardDrive,
    permission: 'manage-storage-settings',
    editPermission: 'edit-storage-settings',
    component: 'storage-settings',
    tab: 'Storage',
  },
  {
    order: 500,
    title: t('Email Settings'),
    href: '#email-settings',
    icon: Mail,
    permission: 'manage-email-settings',
    editPermission: 'edit-email-settings',
    component: 'email-settings',
    tab: 'Email',
  },
  {
    order: 510,
    title: t('Email Notification Settings'),
    href: '#email-notification-settings',
    icon: Mail,
    permission: 'manage-email-notification-settings',
    editPermission: 'manage-email-notification-settings',
    component: 'email-notification-settings',
    tab: 'EmailNotification',
  },
  {
    order: 1000,
    title: t('Bank Transfer Settings'),
    href: '#bank-transfer-settings',
    icon: CreditCard,
    permission: 'manage-bank-transfer-settings',
    editPermission: 'edit-bank-transfer-settings',
    component: 'bank-transfer-settings',
    tab: 'Payment',
  },
]

/**
 * Payment gateway tabs injected when Stripe/PayPal add-ons are enabled (legacy parity).
 */
export function getPaymentGatewayMenuItems(
  t: (key: string) => string,
  enabledModuleNames: Iterable<string>,
): SettingMenuItem[] {
  const enabled = new Set(enabledModuleNames)
  const items: SettingMenuItem[] = []

  if (enabled.has('Stripe')) {
    items.push({
      order: 990,
      title: t('Stripe Settings'),
      href: '#stripe-settings',
      icon: CreditCard,
      permission: 'manage-stripe-settings',
      editPermission: 'edit-stripe-settings',
      component: 'stripe-settings',
      tab: 'Stripe',
    })
  }

  if (enabled.has('Paypal')) {
    items.push({
      order: 995,
      title: t('PayPal Settings'),
      href: '#paypal-settings',
      icon: CreditCard,
      permission: 'manage-paypal-settings',
      editPermission: 'edit-paypal-settings',
      component: 'paypal-settings',
      tab: 'PayPal',
    })
  }

  return items
}

/**
 * Add-on settings tabs injected when modules are enabled (legacy package menus).
 */
export function getAddonSettingsMenuItems(
  t: (key: string) => string,
  enabledModuleNames: Iterable<string>,
): SettingMenuItem[] {
  const enabled = new Set(enabledModuleNames)
  const items: SettingMenuItem[] = []

  if (enabled.has('GoogleCaptcha')) {
    items.push({
      order: 600,
      title: t('Google reCAPTCHA Settings'),
      href: '#google-captcha-settings',
      icon: Shield,
      permission: 'manage-google-captcha-settings',
      editPermission: 'edit-google-captcha-settings',
      component: 'google-captcha-settings',
      tab: 'reCAPTCHA',
    })
  }

  if (enabled.has('Webhook')) {
    items.push({
      order: 700,
      title: t('Webhook Settings'),
      href: '#webhook-settings',
      icon: Link2,
      permission: 'manage-webhooks',
      editPermission: 'edit-webhooks',
      component: 'webhook-settings',
      tab: 'Webhooks',
    })
  }

  return items
}

export function getSettingsMenuItems(
  t: (key: string) => string,
  roles: string[],
  enabledModuleNames: Iterable<string> = [],
): SettingMenuItem[] {
  const base = roles.includes('superadmin') ? superAdminItems(t) : companyItems(t)
  const gateways = roles.includes('superadmin')
    ? getPaymentGatewayMenuItems(t, enabledModuleNames)
    : []
  const addons = roles.includes('superadmin')
    ? getAddonSettingsMenuItems(t, enabledModuleNames)
    : []
  return [...base, ...gateways, ...addons].sort((a, b) => a.order - b.order)
}

export function canAccessSettingsSection(
  permissions: string[],
  item: SettingMenuItem,
  roles: string[] = [],
  userType?: string,
): boolean {
  if (
    permissions.includes('manage-settings') ||
    roles.includes('superadmin') ||
    roles.includes('company') ||
    userType === 'superadmin' ||
    userType === 'company'
  ) {
    return true
  }
  return (
    permissions.includes(item.permission) ||
    permissions.includes(item.editPermission)
  )
}

export function canEditSettingsSection(
  permissions: string[],
  item: SettingMenuItem,
  roles: string[] = [],
  userType?: string,
): boolean {
  if (
    permissions.includes('manage-settings') ||
    permissions.includes('edit-settings') ||
    roles.includes('superadmin') ||
    roles.includes('company') ||
    userType === 'superadmin' ||
    userType === 'company'
  ) {
    return true
  }
  return permissions.includes(item.editPermission)
}
