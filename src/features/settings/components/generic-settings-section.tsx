import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionPanel } from '@/components/ui/section-panel'
import { Textarea } from '@/components/ui/textarea'
import { useSettingsContext } from '../context/settings-context'
import type { SettingsSectionProps } from '../types'

type Props = SettingsSectionProps & {
  title: string
  description: string
  icon: LucideIcon
  editPermission: string
  multilineKeys?: string[]
}

const LABELS: Record<string, string> = {
  meta_title: 'Meta title',
  meta_description: 'Meta description',
  meta_keywords: 'Meta keywords',
  cookie_consent: 'Cookie consent',
  cookie_title: 'Cookie title',
  cookie_description: 'Cookie description',
  pusher_app_id: 'Pusher app ID',
  pusher_app_key: 'Pusher app key',
  pusher_app_secret: 'Pusher app secret',
  pusher_app_cluster: 'Pusher cluster',
  storage_setting: 'Storage driver',
  local_storage_validation: 'Local storage validation',
  local_storage_max_upload_size: 'Local max upload size (MB)',
  s3_key: 'S3 key',
  s3_secret: 'S3 secret',
  s3_region: 'S3 region',
  s3_bucket: 'S3 bucket',
  wasabi_key: 'Wasabi key',
  wasabi_secret: 'Wasabi secret',
  wasabi_region: 'Wasabi region',
  wasabi_bucket: 'Wasabi bucket',
  invoice_prefix: 'Invoice prefix',
  invoice_starting_number: 'Invoice starting number',
  invoice_template: 'Invoice template',
  invoice_color: 'Invoice color',
  plan_package: 'Plan package',
  plan_trial: 'Plan trial',
  recaptcha_module: 'reCAPTCHA module enabled',
  google_recaptcha_key: 'Google reCAPTCHA site key',
  google_recaptcha_secret: 'Google reCAPTCHA secret key',
  webhook_url: 'Webhook URL',
  bank_name: 'Bank name',
  bank_holder_name: 'Account holder name',
  bank_account_number: 'Account number',
  bank_ifsc_code: 'IFSC / routing code',
  bank_other_details: 'Bank transfer instructions',
  bank_transfer_payment: 'Bank transfer enabled',
}

export function GenericSettingsSection({
  tab,
  title,
  description,
  icon: Icon,
  editPermission,
  multilineKeys = [],
}: Props) {
  const { t } = useTranslation()
  const { userSettings, payload, saveTab, isSaving, canEdit } = useSettingsContext()
  const keys = Object.keys(payload?.groups[tab] ?? {})
  const canEditSection = canEdit(editPermission)

  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const key of keys) {
      initial[key] = userSettings[key] ?? ''
    }
    setSettings(initial)
  }, [userSettings, keys.join(',')])

  if (keys.length === 0) {
    return null
  }

  const handleSave = async () => {
    await saveTab(tab, settings)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {canEditSection && (
          <Button
            className="order-2 rtl:order-1"
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <SectionPanel>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {keys.map((key) => (
            <div
              key={key}
              className={`space-y-3 ${multilineKeys.includes(key) ? 'md:col-span-2' : ''}`}
            >
              <Label htmlFor={key}>{LABELS[key] ?? key.replace(/_/g, ' ')}</Label>
              {multilineKeys.includes(key) ? (
                <Textarea
                  id={key}
                  value={settings[key] ?? ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  disabled={!canEditSection}
                  rows={3}
                />
              ) : (
                <Input
                  id={key}
                  value={settings[key] ?? ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  disabled={!canEditSection}
                />
              )}
            </div>
          ))}
          </div>
        </SectionPanel>
      </CardContent>
    </Card>
  )
}
