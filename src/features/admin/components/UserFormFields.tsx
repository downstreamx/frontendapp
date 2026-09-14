import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { PhoneInputComponent } from '@/components/ui/phone-input'
import { PrefixedPhoneInput } from '@/components/ui/prefixed-phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import {
  DEFAULT_NIGERIA_COUNTRY,
  NigeriaStateCityFields,
} from '@/components/forms/nigeria-state-city-fields'
import { paths } from '@/lib/paths'

export function avatarForUserForm(avatar: string | null | undefined): string {
  if (!avatar || avatar === 'avatar.png') return ''
  return avatar
}

export type UserFormState = {
  company_name: string
  company_address: string
  company_city: string
  company_state: string
  company_country: string
  company_logo: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  mobile_no: string
  password: string
  password_confirmation: string
  role_id: string
  avatar: string
  is_enable_login: boolean
}

type Props = {
  form: UserFormState
  onChange: (next: UserFormState) => void
  isEdit: boolean
  companiesContext: boolean
  roles: Record<string, string>
}

export function UserFormFields({ form, onChange, isEdit, companiesContext, roles }: Props) {
  const { t } = useTranslation()
  const roleEntries = Object.entries(roles)

  const setField = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="space-y-6">
      {companiesContext ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="company_name">{t('Company Name')}</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setField('company_name', e.target.value)}
              placeholder={t('Enter company name')}
              required
            />
          </div>
          <MediaPicker
            id="company_logo"
            label={t('Company logo')}
            value={form.company_logo}
            onChange={(value) =>
              setField('company_logo', Array.isArray(value) ? (value[0] ?? '') : value)
            }
            placeholder={t('Select company logo')}
          />
          <div className="space-y-1">
            <Label htmlFor="company_address">{t('Company Address')}</Label>
            <Input
              id="company_address"
              value={form.company_address}
              onChange={(e) => setField('company_address', e.target.value)}
              placeholder={t('Enter company address')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <NigeriaStateCityFields
              idPrefix="company"
              stateName={form.company_state}
              cityName={form.company_city}
              country={form.company_country || DEFAULT_NIGERIA_COUNTRY}
              onStateNameChange={(stateName) => setField('company_state', stateName)}
              onCityNameChange={(cityName) => setField('company_city', cityName)}
              onCountryChange={(country) => setField('company_country', country)}
              countryEditable
              className="space-y-1"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="first_name">{t('First name')}</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setField('first_name', e.target.value)}
              placeholder={t('Enter first name')}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="middle_name">{t('Middle name')}</Label>
            <Input
              id="middle_name"
              value={form.middle_name}
              onChange={(e) => setField('middle_name', e.target.value)}
              placeholder={t('Enter middle name (optional)')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last_name">{t('Last name')}</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setField('last_name', e.target.value)}
              placeholder={t('Enter last name')}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">{t('Email')}</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder={t('Enter email address')}
            required
          />
        </div>
        {companiesContext ? (
          <PrefixedPhoneInput
            label={t('Mobile Number')}
            country={form.company_country || DEFAULT_NIGERIA_COUNTRY}
            value={form.mobile_no}
            onChange={(value) => setField('mobile_no', value)}
          />
        ) : (
          <PhoneInputComponent
            label={t('Mobile Number')}
            value={form.mobile_no}
            onChange={(value) => setField('mobile_no', value)}
            placeholder="+1234567890"
          />
        )}
        {!companiesContext ? (
          <MediaPicker
            id="avatar"
            label={t('Profile Image')}
            value={form.avatar}
            onChange={(value) =>
              setField('avatar', Array.isArray(value) ? (value[0] ?? '') : value)
            }
            placeholder={t('Select profile image')}
          />
        ) : null}
      </div>

      {!isEdit ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="password">{t('Password')}</Label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder={t('Enter password')}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
            <PasswordInput
              id="password_confirmation"
              value={form.password_confirmation}
              onChange={(e) => setField('password_confirmation', e.target.value)}
              placeholder={t('Confirm password')}
              required
            />
          </div>
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 ${companiesContext ? '' : 'md:grid-cols-2'}`}>
        {!companiesContext ? (
          <div className="space-y-1">
            <Label htmlFor="role_id">{t('Role')}</Label>
            <Select value={form.role_id} onValueChange={(value) => setField('role_id', value)}>
              <SelectTrigger id="role_id">
                <SelectValue placeholder={t('Select role')} />
              </SelectTrigger>
              <SelectContent>
                {roleEntries.map(([roleId, label]) => (
                  <SelectItem key={roleId} value={roleId}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('Create role here.')}{' '}
                <Link to={paths.roles.create} className="text-primary hover:underline">
                  {t('Create role')}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="is_enable_login">{t('Login Status')}</Label>
          <Select
            value={form.is_enable_login ? '1' : '0'}
            onValueChange={(value) => setField('is_enable_login', value === '1')}
          >
            <SelectTrigger id="is_enable_login">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('Enabled')}</SelectItem>
              <SelectItem value="0">{t('Disabled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export const emptyUserForm = (): UserFormState => ({
  company_name: '',
  company_address: '',
  company_city: '',
  company_state: '',
  company_country: 'Nigeria',
  company_logo: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_no: '',
  password: '',
  password_confirmation: '',
  role_id: '',
  avatar: '',
  is_enable_login: true,
})
