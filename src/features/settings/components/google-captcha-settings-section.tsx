import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Save, Shield } from 'lucide-react'
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
import type { SettingsSectionProps } from '../types'

const TAB = 'reCAPTCHA'

type RecaptchaForm = {
  recaptcha_version: string
  recaptcha_site_key: string
  recaptcha_secret_key: string
  recaptcha_enabled: string
}

function fromApi(userSettings: Record<string, string>): RecaptchaForm {
  return {
    recaptcha_version: userSettings.recaptcha_version || 'v2',
    recaptcha_site_key: userSettings.recaptcha_site_key || '',
    recaptcha_secret_key: userSettings.recaptcha_secret_key || '',
    recaptcha_enabled: userSettings.recaptcha_enabled || 'off',
  }
}

export function GoogleCaptchaSettingsSection(_props: SettingsSectionProps) {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-google-captcha-settings')
  const [showSecret, setShowSecret] = useState(false)
  const [settings, setSettings] = useState<RecaptchaForm>(() => fromApi(userSettings))

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const handleSave = async () => {
    await saveTab(TAB, {
      ...settings,
      recaptcha_enabled: settings.recaptcha_enabled === 'on' ? 'on' : 'off',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            {t('Google reCAPTCHA Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Google reCAPTCHA for form protection')}
          </p>
        </div>
        {canEditSection && (
          <Button className="order-2 rtl:order-1" onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="recaptcha_enabled" className="text-base font-medium">
                {t('Enable reCAPTCHA')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable Google reCAPTCHA protection for forms')}
              </p>
            </div>
            <Switch
              id="recaptcha_enabled"
              checked={settings.recaptcha_enabled === 'on'}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  recaptcha_enabled: checked ? 'on' : 'off',
                }))
              }
              disabled={!canEditSection}
            />
          </div>

          {settings.recaptcha_enabled === 'on' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="recaptcha_version">{t('reCAPTCHA Version')}</Label>
                  <Select
                    value={settings.recaptcha_version}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, recaptcha_version: value }))
                    }
                    disabled={!canEditSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select reCAPTCHA version')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v2">{t('reCAPTCHA v2')}</SelectItem>
                      <SelectItem value="v3">{t('reCAPTCHA v3')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="recaptcha_site_key">{t('Site Key')}</Label>
                    <Input
                      id="recaptcha_site_key"
                      value={settings.recaptcha_site_key}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          recaptcha_site_key: e.target.value,
                        }))
                      }
                      placeholder={t('Enter reCAPTCHA Site Key')}
                      disabled={!canEditSection}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="recaptcha_secret_key">{t('Secret Key')}</Label>
                    <div className="relative">
                      <Input
                        id="recaptcha_secret_key"
                        type={showSecret ? 'text' : 'password'}
                        value={settings.recaptcha_secret_key}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            recaptcha_secret_key: e.target.value,
                          }))
                        }
                        placeholder={t('Enter reCAPTCHA Secret Key')}
                        disabled={!canEditSection}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSecret((v) => !v)}
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="p-4 bg-muted/30 rounded-lg border text-sm text-muted-foreground space-y-2">
                  <h4 className="font-medium text-foreground">
                    {t('How to get Google reCAPTCHA keys')}
                  </h4>
                  <p>
                    {t('Go to')}{' '}
                    <a
                      href="https://www.google.com/recaptcha/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary"
                    >
                      Google reCAPTCHA Admin Console
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
