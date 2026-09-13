import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Settings } from 'lucide-react'
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
import { useAppContext } from '@/contexts/app-context'
import { useSettingsContext } from '../context/settings-context'

const TAB = 'System'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
]

type SystemSettings = {
  defaultLanguage: string
  dateFormat: string
  timeFormat: string
  calendarStartDay: string
  enableRegistration: string
  enableEmailVerification: string
  landingPageEnabled: string
  termsConditionsUrl: string
}

function parseOnOff(value: string | undefined): string {
  return value === 'on' || value === '1' ? 'on' : 'off'
}

function buildInitial(userSettings: Record<string, string>): SystemSettings {
  return {
    defaultLanguage: userSettings.defaultLanguage || 'en',
    dateFormat: userSettings.dateFormat || 'Y-m-d',
    timeFormat: userSettings.timeFormat || 'H:i',
    calendarStartDay: userSettings.calendarStartDay || '0',
    enableRegistration: parseOnOff(userSettings.enableRegistration),
    enableEmailVerification: parseOnOff(userSettings.enableEmailVerification),
    landingPageEnabled: parseOnOff(userSettings.landingPageEnabled),
    termsConditionsUrl: userSettings.termsConditionsUrl || '',
  }
}

export function SystemSettingsSection() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-system-settings')
  const isSuperAdmin = auth.roles.includes('superadmin')
  const [settings, setSettings] = useState<SystemSettings>(() => buildInitial(userSettings))

  useEffect(() => {
    setSettings(buildInitial(userSettings))
  }, [userSettings])

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value ? 'on' : 'off' }))
  }

  const handleSave = async () => {
    await saveTab(TAB, settings as unknown as Record<string, string>)
  }

  const dateFormats = [
    { value: 'Y-m-d', label: 'YYYY-MM-DD (2024-01-15)' },
    { value: 'm-d-Y', label: 'MM-DD-YYYY (01-15-2024)' },
    { value: 'd-m-Y', label: 'DD-MM-YYYY (15-01-2024)' },
    { value: 'Y/m/d', label: 'YYYY/MM/DD (2024/01/15)' },
    { value: 'm/d/Y', label: 'MM/DD/YYYY (01/15/2024)' },
    { value: 'd/m/Y', label: 'DD/MM/YYYY (15/01/2024)' },
  ]

  const timeFormats = [
    { value: 'H:i', label: '24 Hour (13:30)' },
    { value: 'g:i A', label: '12 Hour (1:30 PM)' },
  ]

  const days = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            {t('System Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure system-wide settings for your application')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>{t('Default Language')}</Label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={(value) => handleSelectChange('defaultLanguage', value)}
                disabled={!canEditSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select language')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>{t('Date Format')}</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => handleSelectChange('dateFormat', value)}
                disabled={!canEditSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select date format')} />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>{t('Time Format')}</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(value) => handleSelectChange('timeFormat', value)}
                disabled={!canEditSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select time format')} />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>{t('Calendar Start Day')}</Label>
              <Select
                value={settings.calendarStartDay}
                onValueChange={(value) => handleSelectChange('calendarStartDay', value)}
                disabled={!canEditSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select start day')} />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {t(day.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isSuperAdmin && (
            <>
              <div className="space-y-3">
                <Label>{t('Terms & Conditions URL')}</Label>
                <Input
                  type="url"
                  value={settings.termsConditionsUrl}
                  onChange={(e) => handleSelectChange('termsConditionsUrl', e.target.value)}
                  placeholder="https://example.com/terms"
                  disabled={!canEditSection}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>{t('Enable Registration')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.enableRegistration === 'on'}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('enableRegistration', checked)
                      }
                      disabled={!canEditSection}
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.enableRegistration === 'on'
                        ? t('New users can register accounts')
                        : t('Registration is disabled')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>{t('Enable Email Verification')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.enableEmailVerification === 'on'}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('enableEmailVerification', checked)
                      }
                      disabled={!canEditSection}
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.enableEmailVerification === 'on'
                        ? t('Users must verify their email')
                        : t('Email verification not required')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>{t('Enable Landing Page')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.landingPageEnabled === 'on'}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('landingPageEnabled', checked)
                      }
                      disabled={!canEditSection}
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.landingPageEnabled === 'on'
                        ? t('Landing page is accessible')
                        : t('Landing page is disabled')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
