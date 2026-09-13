import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useSettingsContext } from '../context/settings-context'

const TAB = 'Payment'

type BankFormState = {
  enabled: boolean
  bank_name: string
  bank_holder_name: string
  bank_account_number: string
  bank_ifsc_code: string
  instructions: string
}

function buildInitial(userSettings: Record<string, string>): BankFormState {
  return {
    enabled: userSettings.bank_transfer_payment === 'on',
    bank_name: userSettings.bank_name || '',
    bank_holder_name: userSettings.bank_holder_name || '',
    bank_account_number: userSettings.bank_account_number || '',
    bank_ifsc_code: userSettings.bank_ifsc_code || '',
    instructions: userSettings.bank_other_details || '',
  }
}

function toApiPayload(form: BankFormState): Record<string, string> {
  return {
    bank_transfer_payment: form.enabled ? 'on' : 'off',
    bank_name: form.bank_name,
    bank_holder_name: form.bank_holder_name,
    bank_account_number: form.bank_account_number,
    bank_ifsc_code: form.bank_ifsc_code,
    bank_other_details: form.instructions,
  }
}

export function BankTransferSettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-bank-transfer-settings')
  const [settings, setSettings] = useState<BankFormState>(() => buildInitial(userSettings))

  useEffect(() => {
    setSettings(buildInitial(userSettings))
  }, [userSettings])

  const handleSave = async () => {
    await saveTab(TAB, toApiPayload(settings))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {t('Bank Transfer Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure bank transfer payment method for your customers')}
          </p>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="bankTransferEnabled" className="text-base font-medium">
                {t('Enable Bank Transfer')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Allow customers to pay via bank transfer')}
              </p>
            </div>
            <Switch
              id="bankTransferEnabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enabled: checked }))
              }
              disabled={!canEditSection}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">{t('Bank name')}</Label>
                  <Input
                    id="bank_name"
                    value={settings.bank_name}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, bank_name: e.target.value }))
                    }
                    disabled={!canEditSection}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_holder_name">{t('Account holder name')}</Label>
                  <Input
                    id="bank_holder_name"
                    value={settings.bank_holder_name}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, bank_holder_name: e.target.value }))
                    }
                    disabled={!canEditSection}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">{t('Account number')}</Label>
                  <Input
                    id="bank_account_number"
                    value={settings.bank_account_number}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, bank_account_number: e.target.value }))
                    }
                    disabled={!canEditSection}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc_code">{t('IFSC / routing code')}</Label>
                  <Input
                    id="bank_ifsc_code"
                    value={settings.bank_ifsc_code}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, bank_ifsc_code: e.target.value }))
                    }
                    disabled={!canEditSection}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="instructions">{t('Bank Transfer Instructions')}</Label>
                <Textarea
                  id="instructions"
                  value={settings.instructions}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder={t('Enter bank transfer instructions. Use <br/> for line breaks.')}
                  rows={8}
                  disabled={!canEditSection}
                />
                <p className="text-xs text-muted-foreground">
                  {t('These instructions will be shown to customers. You can use <br/> tags for line breaks.')}
                </p>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-medium mb-3">{t('Customer Preview')}</h4>
                <div className="text-sm">
                  {settings.instructions ? (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: settings.instructions.replace(/<br\/>/g, '<br/>'),
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">{t('No instructions provided')}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
