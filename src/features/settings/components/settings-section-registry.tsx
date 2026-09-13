import type { ComponentType } from 'react'
import { GenericSettingsSection } from './generic-settings-section'
import { BrandSettingsSection } from './brand-settings-section'
import { CompanySettingsSection } from './company-settings-section'
import { SystemSettingsSection } from './system-settings-section'
import { CurrencySettingsSection } from './currency-settings-section'
import { EmailSettingsSection } from './email-settings-section'
import { EmailNotificationSettingsSection } from './email-notification-settings-section'
import { BankTransferSettingsSection } from './bank-transfer-settings-section'
import { SubscriptionSettingsSection } from './subscription-settings-section'
import { CacheSettingsSection } from './cache-settings-section'
import { CookieSettingsSection } from './cookie-settings-section'
import { StorageSettingsSection } from './storage-settings-section'
import { SeoSettingsSection } from './seo-settings-section'
import { GoogleCaptchaSettingsSection } from './google-captcha-settings-section'
import { StripeSettingsSection } from './stripe-settings-section'
import { PaypalSettingsSection } from './paypal-settings-section'
import type { SettingsSectionProps } from '../types'
import { FileText, Link2, Radio, Settings } from 'lucide-react'

const REGISTRY: Record<string, ComponentType<SettingsSectionProps>> = {
  'brand-settings': BrandSettingsSection,
  'system-settings': SystemSettingsSection,
  'company-settings': CompanySettingsSection,
  'currency-settings': CurrencySettingsSection,
  'email-settings': EmailSettingsSection,
  'email-notification-settings': EmailNotificationSettingsSection,
  'bank-transfer-settings': BankTransferSettingsSection,
  'cache-settings': CacheSettingsSection,
  'cookie-settings': CookieSettingsSection,
  'stripe-settings': StripeSettingsSection,
  'paypal-settings': PaypalSettingsSection,
  'pusher-settings': (props) => (
    <GenericSettingsSection
      {...props}
      tab="Pusher"
      title="Pusher Settings"
      description="Realtime broadcasting configuration"
      icon={Radio}
      editPermission="edit-pusher-settings"
    />
  ),
  'seo-settings': SeoSettingsSection,
  'storage-settings': StorageSettingsSection,
  'google-captcha-settings': GoogleCaptchaSettingsSection,
  'invoice-settings': (props) => (
    <GenericSettingsSection
      {...props}
      tab="Invoice"
      title="Invoice Settings"
      description="Invoice numbering and template defaults"
      icon={FileText}
      editPermission="edit-settings"
    />
  ),
  'subscription-settings': SubscriptionSettingsSection,
  'recaptcha-settings': GoogleCaptchaSettingsSection,
  'webhook-settings': (props) => (
    <GenericSettingsSection
      {...props}
      tab="Webhooks"
      title="Webhook Settings"
      description="Default outbound webhook URL"
      icon={Link2}
      editPermission="edit-webhooks"
    />
  ),
  'webhooks-settings': (props) => (
    <GenericSettingsSection
      {...props}
      tab="Webhooks"
      title="Webhook Settings"
      description="Default outbound webhook URL"
      icon={Link2}
      editPermission="edit-webhooks"
    />
  ),
}

export function getSettingsSectionComponent(
  id: string,
): ComponentType<SettingsSectionProps> | null {
  return REGISTRY[id] ?? null
}
