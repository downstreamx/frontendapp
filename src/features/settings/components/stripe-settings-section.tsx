import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSettingsContext } from '../context/settings-context'

const TAB = 'Stripe'

type StripeForm = {
  stripe_key: string
  stripe_secret: string
  stripe_enabled: string
}

function fromApi(userSettings: Record<string, string>): StripeForm {
  return {
    stripe_key: userSettings.stripe_key ?? '',
    stripe_secret: userSettings.stripe_secret ?? '',
    stripe_enabled: userSettings.stripe_enabled || 'off',
  }
}

export function StripeSettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-stripe-settings')
  const [settings, setSettings] = useState<StripeForm>(() => fromApi(userSettings))
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const handleSave = async () => {
    await saveTab(TAB, {
      stripe_key: settings.stripe_key,
      stripe_secret: settings.stripe_secret,
      stripe_enabled: settings.stripe_enabled === 'on' ? 'on' : 'off',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {t('Stripe Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Stripe payment gateway settings')}
          </p>
        </div>
        {canEditSection && (
          <Button className="order-2 rtl:order-1" onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-base font-medium">{t('Enable Stripe')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('Enable or disable Stripe payment gateway')}
            </p>
          </div>
          <Switch
            checked={settings.stripe_enabled === 'on'}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, stripe_enabled: checked ? 'on' : 'off' }))
            }
            disabled={!canEditSection}
          />
        </div>

        {settings.stripe_enabled === 'on' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="stripe_key">{t('Stripe Key')}</Label>
              <Input
                id="stripe_key"
                value={settings.stripe_key}
                onChange={(e) => setSettings((p) => ({ ...p, stripe_key: e.target.value }))}
                disabled={!canEditSection}
                placeholder={t('Enter Stripe key')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stripe_secret">{t('Stripe Secret Key')}</Label>
              <div className="relative">
                <Input
                  id="stripe_secret"
                  type={showSecret ? 'text' : 'password'}
                  value={settings.stripe_secret}
                  onChange={(e) => setSettings((p) => ({ ...p, stripe_secret: e.target.value }))}
                  disabled={!canEditSection}
                  className="pr-10"
                />
                {canEditSection && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
