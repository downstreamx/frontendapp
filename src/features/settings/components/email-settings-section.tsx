import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
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
import { useSettingsContext } from '../context/settings-context'
import { sendSettingsTestEmail } from '../settings-actions-api'

const TAB = 'Email'

const EMAIL_PROVIDERS: Record<
  string,
  { name: string; driver: string; host: string; port: string; encryption: string }
> = {
  smtp: {
    name: 'SMTP',
    driver: 'smtp',
    host: 'smtp.example.com',
    port: '587',
    encryption: 'tls',
  },
  sendmail: {
    name: 'Sendmail',
    driver: 'sendmail',
    host: '',
    port: '',
    encryption: 'none',
  },
}

type EmailFormState = {
  provider: string
  driver: string
  host: string
  port: string
  username: string
  password: string
  encryption: string
  fromAddress: string
  fromName: string
}

function fromApiSettings(userSettings: Record<string, string>): EmailFormState {
  const driver = userSettings.mail_driver || 'smtp'
  return {
    provider: driver,
    driver,
    host: userSettings.mail_host || 'smtp.example.com',
    port: userSettings.mail_port || '587',
    username: userSettings.mail_username || '',
    password: userSettings.mail_password || '',
    encryption: userSettings.mail_encryption || 'tls',
    fromAddress: userSettings.mail_from_address || 'noreply@example.com',
    fromName: userSettings.mail_from_name || '',
  }
}

function toApiSettings(form: EmailFormState): Record<string, string> {
  return {
    mail_driver: form.driver,
    mail_host: form.host,
    mail_port: form.port,
    mail_username: form.username,
    mail_password: form.password,
    mail_encryption: form.encryption,
    mail_from_address: form.fromAddress,
    mail_from_name: form.fromName,
  }
}

export function EmailSettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-email-settings')
  const canTestEmail = canEdit('test-email') || canEditSection
  const [settings, setSettings] = useState<EmailFormState>(() => fromApiSettings(userSettings))
  const [showPassword, setShowPassword] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  const testMutation = useMutation({
    mutationFn: () => sendSettingsTestEmail(testEmail),
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error(t('Failed to send test email')),
  })

  useEffect(() => {
    setSettings(fromApiSettings(userSettings))
  }, [userSettings])

  const handleChange = (name: keyof EmailFormState, value: string) => {
    if (name === 'provider' && EMAIL_PROVIDERS[value]) {
      const providerConfig = EMAIL_PROVIDERS[value]
      setSettings((prev) => ({
        ...prev,
        provider: value,
        driver: providerConfig.driver,
        host: providerConfig.host,
        port: providerConfig.port,
        encryption: providerConfig.encryption,
      }))
      return
    }
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    await saveTab(TAB, toApiSettings(settings))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            {t('Email Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure email server settings for system notifications and communications')}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="provider" className="font-medium">
                    {t('Email Provider')}
                  </Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => handleChange('provider', value)}
                    disabled={!canEditSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
                        <SelectItem key={key} value={key}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="driver" className="font-medium">
                    {t('Mail Driver')}
                  </Label>
                  <Input
                    id="driver"
                    value={settings.driver}
                    onChange={(e) => handleChange('driver', e.target.value)}
                    disabled={!canEditSection}
                    placeholder="smtp"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="host" className="font-medium">
                    {t('SMTP Host')}
                  </Label>
                  <Input
                    id="host"
                    value={settings.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                    disabled={!canEditSection}
                    placeholder="smtp.example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="port" className="font-medium">
                    {t('SMTP Port')}
                  </Label>
                  <Input
                    id="port"
                    value={settings.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    disabled={!canEditSection}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="font-medium">
                    {t('SMTP Username')}
                  </Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={!canEditSection}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-medium">
                    {t('SMTP Password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={settings.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={!canEditSection}
                      placeholder="••••••••••••"
                      className="pr-10"
                    />
                    {canEditSection && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="encryption" className="font-medium">
                    {t('Mail Encryption')}
                  </Label>
                  <Select
                    value={settings.encryption}
                    onValueChange={(value) => handleChange('encryption', value)}
                    disabled={!canEditSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">{t('TLS')}</SelectItem>
                      <SelectItem value="ssl">{t('SSL')}</SelectItem>
                      <SelectItem value="none">{t('None')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fromAddress" className="font-medium">
                    {t('From Address')}
                  </Label>
                  <Input
                    id="fromAddress"
                    value={settings.fromAddress}
                    onChange={(e) => handleChange('fromAddress', e.target.value)}
                    disabled={!canEditSection}
                    placeholder="noreply@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fromName" className="font-medium">
                    {t('From Name')}
                  </Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => handleChange('fromName', e.target.value)}
                    disabled={!canEditSection}
                    placeholder={t('System')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-medium">{t('Test Email Configuration')}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="testEmail">{t('Send Test To')}</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={!canTestEmail}
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!canTestEmail || !testEmail || testMutation.isPending}
                    onClick={() => testMutation.mutate()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {testMutation.isPending ? t('Sending...') : t('Send Test Email')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
