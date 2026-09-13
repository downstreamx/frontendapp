import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, DollarSign, Save } from 'lucide-react'
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

const TAB = 'Currency'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
]

type CurrencyFormState = {
  decimalFormat: string
  defaultCurrency: string
  decimalSeparator: string
  thousandsSeparator: string
  floatNumber: boolean
  currencySymbolSpace: boolean
  currencySymbolPosition: string
  currencySymbol: string
  currencyName: string
}

function buildInitial(userSettings: Record<string, string>): CurrencyFormState {
  const defaultCurrency = userSettings.defaultCurrency || 'NGN'
  const selected = CURRENCIES.find((c) => c.code === defaultCurrency)
  return {
    decimalFormat: userSettings.decimalFormat || '2',
    defaultCurrency,
    decimalSeparator: userSettings.decimalSeparator || '.',
    thousandsSeparator: userSettings.thousandsSeparator || ',',
    floatNumber: userSettings.floatNumber !== '0',
    currencySymbolSpace: userSettings.currencySymbolSpace === '1',
    currencySymbolPosition: userSettings.currencySymbolPosition || 'before',
    currencySymbol: userSettings.currencySymbol || selected?.symbol || '₦',
    currencyName: selected?.name || defaultCurrency,
  }
}

function toApiPayload(form: CurrencyFormState): Record<string, string> {
  return {
    decimalFormat: form.decimalFormat,
    defaultCurrency: form.defaultCurrency,
    decimalSeparator: form.decimalSeparator,
    thousandsSeparator: form.thousandsSeparator,
    floatNumber: form.floatNumber ? '1' : '0',
    currencySymbolSpace: form.currencySymbolSpace ? '1' : '',
    currencySymbolPosition: form.currencySymbolPosition,
    currencySymbol: form.currencySymbol,
  }
}

export function CurrencySettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-currency-settings')
  const [settings, setSettings] = useState<CurrencyFormState>(() => buildInitial(userSettings))
  const [previewAmount, setPreviewAmount] = useState(1234.56)

  useEffect(() => {
    setSettings(buildInitial(userSettings))
  }, [userSettings])

  const handleChange = (field: keyof CurrencyFormState, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleCurrencyChange = (code: string) => {
    const selected = CURRENCIES.find((c) => c.code === code)
    setSettings((prev) => ({
      ...prev,
      defaultCurrency: code,
      currencySymbol: selected?.symbol || '$',
      currencyName: selected?.name || code,
    }))
  }

  const formattedPreview = () => {
    try {
      let amount = Number(previewAmount) || 0
      const decimalPlaces = parseInt(settings.decimalFormat, 10) || 2

      if (!settings.floatNumber) {
        amount = Math.floor(amount)
      }

      const parts = Number(amount).toFixed(decimalPlaces).split('.')

      if (settings.thousandsSeparator !== 'none') {
        parts[0] = parts[0].replace(
          /\B(?=(\d{3})+(?!\d))/g,
          settings.thousandsSeparator,
        )
      }

      const formattedNumber = parts.join(settings.decimalSeparator)
      const symbol = settings.currencySymbol
      const space = settings.currencySymbolSpace ? ' ' : ''

      if (settings.currencySymbolPosition === 'before') {
        return `${symbol}${space}${formattedNumber}`
      }
      return `${formattedNumber}${space}${symbol}`
    } catch {
      return 'Invalid format'
    }
  }

  const handleSave = async () => {
    await saveTab(TAB, toApiPayload(settings))
  }

  const decimalFormats = [
    { value: '0', label: '0 (e.g., 1234)' },
    { value: '1', label: '1 (e.g., 1234.5)' },
    { value: '2', label: '2 (e.g., 1234.56)' },
    { value: '3', label: '3 (e.g., 1234.567)' },
    { value: '4', label: '4 (e.g., 1234.5678)' },
  ]

  const thousandsSeparators = [
    { value: ',', label: 'Comma (1,234.56)' },
    { value: '.', label: 'Dot (1.234,56)' },
    { value: ' ', label: 'Space (1 234.56)' },
    { value: 'none', label: 'None (123456.78)' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            {t('Currency Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure how currency values are displayed throughout the application')}
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
        <div className="mb-6 p-4 bg-muted/30 rounded-md border flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center md:items-start mb-3 md:mb-0">
            <div className="text-2xl font-semibold mb-1">{formattedPreview()}</div>
            <div className="text-xs text-muted-foreground">
              {settings.currencyName} ({settings.defaultCurrency})
            </div>
          </div>
          <div className="w-full md:w-auto md:max-w-[200px]">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="text-right h-8 text-sm"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                placeholder="Test amount"
                disabled={!canEditSection}
              />
              <Button
                variant="outline"
                onClick={() => setPreviewAmount(1234.56)}
                type="button"
                size="sm"
                className="h-8 text-xs"
                disabled={!canEditSection}
              >
                {t('Reset')}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>{t('Default Currency')}</Label>
            <Select
              value={settings.defaultCurrency}
              onValueChange={handleCurrencyChange}
              disabled={!canEditSection}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select currency')} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center">
                      <span className="w-8 text-center">{currency.symbol}</span>
                      <span>
                        {currency.code} - {currency.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t('Decimal Places')}</Label>
            <Select
              value={settings.decimalFormat}
              onValueChange={(value) => handleChange('decimalFormat', value)}
              disabled={!canEditSection}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select decimal format')} />
              </SelectTrigger>
              <SelectContent>
                {decimalFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t('Symbol Position')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={settings.currencySymbolPosition === 'before' ? 'default' : 'outline'}
                className="justify-center"
                onClick={() => handleChange('currencySymbolPosition', 'before')}
                disabled={!canEditSection}
              >
                <span className="mr-2">{settings.currencySymbol}</span>100
                {settings.currencySymbolPosition === 'before' && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </Button>
              <Button
                type="button"
                variant={settings.currencySymbolPosition === 'after' ? 'default' : 'outline'}
                className="justify-center"
                onClick={() => handleChange('currencySymbolPosition', 'after')}
                disabled={!canEditSection}
              >
                100<span className="ml-2">{settings.currencySymbol}</span>
                {settings.currencySymbolPosition === 'after' && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t('Decimal Separator')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={settings.decimalSeparator === '.' ? 'default' : 'outline'}
                className="justify-center"
                onClick={() => handleChange('decimalSeparator', '.')}
                disabled={!canEditSection}
              >
                {t('Dot')} (123.45)
                {settings.decimalSeparator === '.' && <Check className="h-4 w-4 ml-2" />}
              </Button>
              <Button
                type="button"
                variant={settings.decimalSeparator === ',' ? 'default' : 'outline'}
                className="justify-center"
                onClick={() => handleChange('decimalSeparator', ',')}
                disabled={!canEditSection}
              >
                {t('Comma')} (123,45)
                {settings.decimalSeparator === ',' && <Check className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t('Thousands Separator')}</Label>
            <Select
              value={settings.thousandsSeparator}
              onValueChange={(value) => handleChange('thousandsSeparator', value)}
              disabled={!canEditSection}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select thousands separator')} />
              </SelectTrigger>
              <SelectContent>
                {thousandsSeparators.map((separator) => (
                  <SelectItem key={separator.value} value={separator.value}>
                    {separator.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="floatNumber">{t('Show Decimals')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Display decimal places in amounts')}
                </p>
              </div>
              <Switch
                id="floatNumber"
                checked={settings.floatNumber}
                onCheckedChange={(checked) => handleChange('floatNumber', checked)}
                disabled={!canEditSection}
              />
            </div>
          </div>

          <div className="space-y-3 border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="currencySymbolSpace">{t('Add Space')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Space between amount and symbol')}
                </p>
              </div>
              <Switch
                id="currencySymbolSpace"
                checked={settings.currencySymbolSpace}
                onCheckedChange={(checked) => handleChange('currencySymbolSpace', checked)}
                disabled={!canEditSection}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
