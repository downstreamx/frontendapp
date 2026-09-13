import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cookie, Download, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { downloadCookieConsentData } from '../settings-actions-api'
import { useSettingsContext } from '../context/settings-context'
import type { SettingsSectionProps } from '../types'

const TAB = 'Cookie'

type CookieForm = {
  enableCookiePopup: boolean
  enableLogging: boolean
  strictlyNecessaryCookies: boolean
  cookieTitle: string
  strictlyCookieTitle: string
  cookieDescription: string
  strictlyCookieDescription: string
  contactUsDescription: string
  contactUsUrl: string
}

function fromApi(userSettings: Record<string, string>): CookieForm {
  return {
    enableCookiePopup: userSettings.enableCookiePopup === '1',
    enableLogging: userSettings.enableLogging === '1',
    strictlyNecessaryCookies:
      userSettings.strictlyNecessaryCookies === '1' ||
      userSettings.strictlyNecessaryCookies === '',
    cookieTitle: userSettings.cookieTitle || 'Cookie Consent',
    strictlyCookieTitle:
      userSettings.strictlyCookieTitle || 'Strictly Necessary Cookies',
    cookieDescription:
      userSettings.cookieDescription ||
      'We use cookies to enhance your browsing experience and provide personalized content.',
    strictlyCookieDescription:
      userSettings.strictlyCookieDescription ||
      'These cookies are essential for the website to function properly.',
    contactUsDescription:
      userSettings.contactUsDescription ||
      'If you have any questions about our cookie policy, please contact us.',
    contactUsUrl: userSettings.contactUsUrl || 'https://example.com/contact',
  }
}

function toApi(form: CookieForm): Record<string, string> {
  return {
    enableCookiePopup: form.enableCookiePopup ? '1' : '0',
    enableLogging: form.enableLogging ? '1' : '0',
    strictlyNecessaryCookies: form.strictlyNecessaryCookies ? '1' : '0',
    cookieTitle: form.cookieTitle,
    strictlyCookieTitle: form.strictlyCookieTitle,
    cookieDescription: form.cookieDescription,
    strictlyCookieDescription: form.strictlyCookieDescription,
    contactUsDescription: form.contactUsDescription,
    contactUsUrl: form.contactUsUrl,
  }
}

export function CookieSettingsSection(_props: SettingsSectionProps) {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-cookie-settings')
  const canDownload =
    canEdit('manage-cookie-settings') || canEdit('edit-cookie-settings')

  const [settings, setSettings] = useState<CookieForm>(() => fromApi(userSettings))

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const handleChange = (name: keyof CookieForm, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    await saveTab(TAB, toApi(settings))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cookie className="h-5 w-5" />
            {t('Cookie Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure cookie consent and privacy settings for your application')}
          </p>
        </div>
        <div className="flex gap-2 order-2 rtl:order-1">
          {canDownload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void downloadCookieConsentData()}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('Download Cookie Data')}
            </Button>
          )}
          {canEditSection && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t('Saving...') : t('Save Changes')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="enableCookiePopup">{t('Enable Cookie Popup')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('Show cookie consent popup to visitors')}
                </p>
              </div>
              <Switch
                id="enableCookiePopup"
                checked={settings.enableCookiePopup}
                onCheckedChange={(checked) =>
                  handleChange('enableCookiePopup', checked)
                }
                disabled={!canEditSection}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="enableLogging">{t('Enable Logging')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('Enable cookie activity logging')}
                </p>
              </div>
              <Switch
                id="enableLogging"
                checked={settings.enableLogging}
                onCheckedChange={(checked) => handleChange('enableLogging', checked)}
                disabled={!canEditSection}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="strictlyNecessaryCookies">
                  {t('Strictly Necessary Cookies')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('Enable strictly necessary cookies')}
                </p>
              </div>
              <Switch
                id="strictlyNecessaryCookies"
                checked={settings.strictlyNecessaryCookies}
                onCheckedChange={(checked) =>
                  handleChange('strictlyNecessaryCookies', checked)
                }
                disabled={!canEditSection}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cookieTitle">{t('Cookie Title')}</Label>
              <Input
                id="cookieTitle"
                value={settings.cookieTitle}
                onChange={(e) => handleChange('cookieTitle', e.target.value)}
                disabled={!canEditSection}
                placeholder={t('Enter the main cookie consent title')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="strictlyCookieTitle">{t('Strictly Cookie Title')}</Label>
              <Input
                id="strictlyCookieTitle"
                value={settings.strictlyCookieTitle}
                onChange={(e) => handleChange('strictlyCookieTitle', e.target.value)}
                disabled={!canEditSection}
                placeholder={t('Enter the strictly necessary cookies title')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cookieDescription">{t('Cookie Description')}</Label>
              <Textarea
                id="cookieDescription"
                value={settings.cookieDescription}
                onChange={(e) => handleChange('cookieDescription', e.target.value)}
                disabled={!canEditSection}
                placeholder={t('Enter the cookie consent description')}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="strictlyCookieDescription">
                {t('Strictly Cookie Description')}
              </Label>
              <Textarea
                id="strictlyCookieDescription"
                value={settings.strictlyCookieDescription}
                onChange={(e) =>
                  handleChange('strictlyCookieDescription', e.target.value)
                }
                disabled={!canEditSection}
                placeholder={t('Enter the strictly necessary cookies description')}
                rows={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactUsDescription">{t('Contact Us Description')}</Label>
              <Textarea
                id="contactUsDescription"
                value={settings.contactUsDescription}
                onChange={(e) => handleChange('contactUsDescription', e.target.value)}
                disabled={!canEditSection}
                placeholder={t('Enter the contact us description for cookie inquiries')}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactUsUrl">{t('Contact Us URL')}</Label>
              <Input
                id="contactUsUrl"
                type="url"
                value={settings.contactUsUrl}
                onChange={(e) => handleChange('contactUsUrl', e.target.value)}
                disabled={!canEditSection}
                placeholder={t('Enter the contact us URL for cookie inquiries')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
