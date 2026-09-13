import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettingsContext } from '../context/settings-context'

const TAB = 'PayPal'

type PaypalForm = {
  paypal_client_id: string
  paypal_secret_key: string
  paypal_enabled: string
  paypal_mode: string
}

function fromApi(userSettings: Record<string, string>): PaypalForm {
  return {
    paypal_client_id: userSettings.paypal_client_id ?? '',
    paypal_secret_key: userSettings.paypal_secret_key ?? '',
    paypal_enabled: userSettings.paypal_enabled || 'off',
    paypal_mode: userSettings.paypal_mode || 'sandbox',
  }
}

export function PaypalSettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-paypal-settings')
  const [settings, setSettings] = useState<PaypalForm>(() => fromApi(userSettings))
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const handleSave = async () => {
    await saveTab(TAB, {
      paypal_client_id: settings.paypal_client_id,
      paypal_secret_key: settings.paypal_secret_key,
      paypal_enabled: settings.paypal_enabled === 'on' ? 'on' : 'off',
      paypal_mode: settings.paypal_mode,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {t('PayPal Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure PayPal payment gateway settings')}
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
            <Label className="text-base font-medium">{t('Enable PayPal')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('Enable or disable PayPal payment gateway')}
            </p>
          </div>
          <Switch
            checked={settings.paypal_enabled === 'on'}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, paypal_enabled: checked ? 'on' : 'off' }))
            }
            disabled={!canEditSection}
          />
        </div>

        {settings.paypal_enabled === 'on' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="paypal_client_id">{t('PayPal Client ID')}</Label>
              <Input
                id="paypal_client_id"
                value={settings.paypal_client_id}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, paypal_client_id: e.target.value }))
                }
                disabled={!canEditSection}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paypal_secret_key">{t('PayPal Secret Key')}</Label>
              <div className="relative">
                <Input
                  id="paypal_secret_key"
                  type={showSecret ? 'text' : 'password'}
                  value={settings.paypal_secret_key}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, paypal_secret_key: e.target.value }))
                  }
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
            <div className="space-y-1.5">
              <Label>{t('PayPal Mode')}</Label>
              <Select
                value={settings.paypal_mode}
                onValueChange={(value) => setSettings((p) => ({ ...p, paypal_mode: value }))}
                disabled={!canEditSection}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">{t('Sandbox')}</SelectItem>
                  <SelectItem value="live">{t('Live')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
