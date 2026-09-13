import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  DEFAULT_NIGERIA_COUNTRY,
  NigeriaStateCityFields,
} from '@/components/forms/nigeria-state-city-fields'
import { useSettingsContext } from '../context/settings-context'

type CompanySettings = {
  company_name: string
  company_address: string
  company_city: string
  company_state: string
  company_country: string
  company_zipcode: string
  company_telephone: string
  company_email_from_name: string
  registration_number: string
  company_email: string
  vat_gst_number_switch: string
  tax_type: string
  vat_number: string
}

const TAB = 'Company'

function buildInitial(userSettings: Record<string, string>): CompanySettings {
  return {
    company_name: userSettings.company_name || '',
    company_address: userSettings.company_address || '',
    company_city: userSettings.company_city || '',
    company_state: userSettings.company_state || '',
    company_country: userSettings.company_country || DEFAULT_NIGERIA_COUNTRY,
    company_zipcode: userSettings.company_zipcode || '',
    company_telephone: userSettings.company_telephone || '',
    company_email_from_name: userSettings.company_email_from_name || '',
    registration_number: userSettings.registration_number || '',
    company_email: userSettings.company_email || '',
    vat_gst_number_switch: userSettings.vat_gst_number_switch || 'off',
    tax_type: userSettings.tax_type || 'VAT',
    vat_number: userSettings.vat_number || '',
  }
}

export function CompanySettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-company-settings')
  const [settings, setSettings] = useState<CompanySettings>(() => buildInitial(userSettings))

  useEffect(() => {
    setSettings(buildInitial(userSettings))
  }, [userSettings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    await saveTab(TAB, settings as unknown as Record<string, string>)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            {t('Company Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure your company information and details')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="company_name">{t('Company Name')}</Label>
            <Input
              id="company_name"
              name="company_name"
              value={settings.company_name}
              onChange={handleInputChange}
              placeholder={t('Enter company name')}
              disabled={!canEditSection}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="registration_number">{t('Registration Number')}</Label>
            <Input
              id="registration_number"
              name="registration_number"
              value={settings.registration_number}
              onChange={handleInputChange}
              placeholder={t('Enter registration number')}
              disabled={!canEditSection}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="company_address">{t('Company Address')}</Label>
            <Input
              id="company_address"
              name="company_address"
              value={settings.company_address}
              onChange={handleInputChange}
              placeholder={t('Enter company address')}
              disabled={!canEditSection}
            />
          </div>

          <NigeriaStateCityFields
            idPrefix="company"
            stateName={settings.company_state}
            cityName={settings.company_city}
            country={settings.company_country}
            onStateNameChange={(company_state) =>
              setSettings((prev) => ({
                ...prev,
                company_state,
                company_city: '',
                company_country: DEFAULT_NIGERIA_COUNTRY,
              }))
            }
            onCityNameChange={(company_city) =>
              setSettings((prev) => ({
                ...prev,
                company_city,
                company_country: DEFAULT_NIGERIA_COUNTRY,
              }))
            }
            onCountryChange={(company_country) =>
              setSettings((prev) => ({ ...prev, company_country }))
            }
            disabled={!canEditSection}
            countryEditable
            className="space-y-3"
          />

          <div className="space-y-3">
            <Label htmlFor="company_zipcode">{t('Zip Code')}</Label>
            <Input
              id="company_zipcode"
              name="company_zipcode"
              value={settings.company_zipcode}
              onChange={handleInputChange}
              placeholder={t('Enter zip code')}
              disabled={!canEditSection}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="company_telephone">{t('Telephone')}</Label>
            <Input
              id="company_telephone"
              name="company_telephone"
              value={settings.company_telephone}
              onChange={handleInputChange}
              placeholder={t('Enter telephone number')}
              disabled={!canEditSection}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="company_email">{t('Company Email')}</Label>
            <Input
              id="company_email"
              name="company_email"
              type="email"
              value={settings.company_email}
              onChange={handleInputChange}
              placeholder={t('Enter company email')}
              disabled={!canEditSection}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="company_email_from_name">{t('Email From Name')}</Label>
            <Input
              id="company_email_from_name"
              name="company_email_from_name"
              value={settings.company_email_from_name}
              onChange={handleInputChange}
              placeholder={t('Enter email from name')}
              disabled={!canEditSection}
            />
            <p className="text-xs text-muted-foreground">
              {t('Name that appears in the "From" field of emails sent by the system')}
            </p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-4 flex-wrap">
              <Label htmlFor="vat_gst_number_switch">{t('Tax Number')}</Label>
              <Switch
                id="vat_gst_number_switch"
                checked={settings.vat_gst_number_switch === 'on'}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    vat_gst_number_switch: checked ? 'on' : 'off',
                  }))
                }
                disabled={!canEditSection}
              />
              {settings.vat_gst_number_switch === 'on' && (
                <>
                  <RadioGroup
                    value={settings.tax_type}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, tax_type: value }))
                    }
                    className="flex gap-4"
                    disabled={!canEditSection}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VAT" id="vat" disabled={!canEditSection} />
                      <Label htmlFor="vat">{t('VAT Number')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="GST" id="gst" disabled={!canEditSection} />
                      <Label htmlFor="gst">{t('GST Number')}</Label>
                    </div>
                  </RadioGroup>
                  <Input
                    name="vat_number"
                    value={settings.vat_number}
                    onChange={handleInputChange}
                    placeholder={t('Enter VAT / GST Number')}
                    className="flex-1 min-w-[200px]"
                    disabled={!canEditSection}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
