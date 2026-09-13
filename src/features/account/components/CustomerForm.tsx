import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InputError from '@/components/ui/input-error'
import { PhoneInputComponent } from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSection } from '@/components/ui/form-section'
import { CategorySelect } from '@/components/setup/CategorySelect'
import { PaymentTermsSelect } from '@/components/setup/PaymentTermsSelect'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import {
  DEFAULT_NIGERIA_COUNTRY,
  NigeriaStateCityFields,
} from '@/components/forms/nigeria-state-city-fields'
import type { CustomerCreateMetaUser } from '../account-party-api'
import type { CustomerFormState, PartyAddress } from '../customer-form-utils'
import type { SetupCategoryOption, SetupPaymentTermOption } from '@/lib/setup-lookup-types'

type PartyKind = 'customer' | 'supplier'

type Props = {
  party?: PartyKind
  mode?: 'create' | 'edit'
  /** @deprecated Use partyCode */
  customerCode?: string
  partyCode?: string
  data: CustomerFormState
  onChange: (next: CustomerFormState) => void
  users?: CustomerCreateMetaUser[]
  paymentTerms?: SetupPaymentTermOption[]
  categories?: SetupCategoryOption[]
  errors?: Record<string, string>
  isPending?: boolean
  submitLabel: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function fieldError(errors: Record<string, string> | undefined, key: string) {
  return errors?.[key]
}

function AddressSection({
  title,
  prefix,
  address,
  onAddressChange,
  errors,
  required,
}: {
  title: string
  prefix: 'billing_address' | 'shipping_address'
  address: PartyAddress
  onAddressChange: (next: PartyAddress) => void
  errors?: Record<string, string>
  required?: boolean
}) {
  const { t } = useTranslation()

  const setField = (key: keyof PartyAddress, value: string) => {
    onAddressChange({ ...address, [key]: value })
  }

  return (
    <FormSection title={title} variant="highlight">
      <div className="space-y-4">
        <div>
          <Label htmlFor={`${prefix}-name`}>{t('Name')}</Label>
          <Input
            id={`${prefix}-name`}
            value={address.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('Enter name')}
            required={required}
          />
          <InputError message={fieldError(errors, `${prefix}.name`)} />
        </div>
        <div>
          <Label htmlFor={`${prefix}-line1`}>{t('Address')}</Label>
          <Input
            id={`${prefix}-line1`}
            value={address.address_line_1}
            onChange={(e) => setField('address_line_1', e.target.value)}
            placeholder={t('Enter address')}
            required={required}
          />
          <InputError message={fieldError(errors, `${prefix}.address_line_1`)} />
        </div>
        <div>
          <Label htmlFor={`${prefix}-line2`}>{t('Address Line 2')}</Label>
          <Input
            id={`${prefix}-line2`}
            value={address.address_line_2}
            onChange={(e) => setField('address_line_2', e.target.value)}
            placeholder={t('Apartment, suite, etc. (optional)')}
          />
          <InputError message={fieldError(errors, `${prefix}.address_line_2`)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NigeriaStateCityFields
            idPrefix={prefix}
            stateName={address.state}
            cityName={address.city}
            country={address.country || DEFAULT_NIGERIA_COUNTRY}
            onStateNameChange={(state) => setField('state', state)}
            onCityNameChange={(city) => setField('city', city)}
            onCountryChange={(country) => setField('country', country)}
            required={required}
            stateError={fieldError(errors, `${prefix}.state`)}
            cityError={fieldError(errors, `${prefix}.city`)}
            countryError={fieldError(errors, `${prefix}.country`)}
            className="space-y-2"
          />
          <div>
            <Label htmlFor={`${prefix}-zip`}>{t('Zip Code')}</Label>
            <Input
              id={`${prefix}-zip`}
              value={address.zip_code}
              onChange={(e) => setField('zip_code', e.target.value)}
              placeholder={t('Enter zip code')}
              required={required}
            />
            <InputError message={fieldError(errors, `${prefix}.zip_code`)} />
          </div>
        </div>
      </div>
    </FormSection>
  )
}

export function CustomerForm({
  party = 'customer',
  mode = 'create',
  customerCode,
  partyCode,
  data,
  onChange,
  users = [],
  paymentTerms = [],
  categories = [],
  errors,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const code = partyCode ?? customerCode
  const isSupplier = party === 'supplier'
  const canCreateUsers = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-users',
  )

  const setField = <K extends keyof CustomerFormState>(key: K, value: CustomerFormState[K]) => {
    onChange({ ...data, [key]: value })
  }

  const handleUserSelect = (userId: string) => {
    if (userId === '0') {
      setField('user_id', '')
      return
    }
    const selected = users.find((user) => String(user.id) === userId)
    onChange({
      ...data,
      user_id: userId,
      contact_person_name: selected?.name ?? data.contact_person_name,
      contact_person_email: selected?.email ?? data.contact_person_email,
      contact_person_mobile: selected?.mobile_no ?? data.contact_person_mobile,
    })
  }

  const handleSameAsBilling = (checked: boolean) => {
    onChange({
      ...data,
      same_as_billing: checked,
      shipping_address: checked ? { ...data.billing_address } : data.shipping_address,
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isSupplier ? t('Supplier details') : t('Customer details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'edit' && code ? (
            <div>
              <Label>{isSupplier ? t('Supplier Code') : t('Customer Code')}</Label>
              <Input value={code} readOnly disabled className="bg-muted" />
            </div>
          ) : null}

          {mode === 'create' ? (
          <div>
            <Label htmlFor="user_id">{t('User')}</Label>
            <Select value={data.user_id || '0'} onValueChange={handleUserSelect}>
              <SelectTrigger id="user_id">
                <SelectValue placeholder={t('Select a user (optional)')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('No User Selected')}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={fieldError(errors, 'user_id')} />
            {users.length === 0 && canCreateUsers ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('Create user here.')}{' '}
                <Link to={paths.users.index} className="text-primary hover:underline">
                  {t('Create user')}
                </Link>
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {isSupplier
                ? t(
                    'Note: Only users with supplier role who are not already assigned to other suppliers will appear in this list.',
                  )
                : t(
                    'Note: Only users with the customer role who are not already assigned to other customers will appear in this list.',
                  )}
            </p>
          </div>
          ) : null}

          <div>
            <Label htmlFor="company_name">{t('Company Name')}</Label>
            <Input
              id="company_name"
              value={data.company_name}
              onChange={(e) => setField('company_name', e.target.value)}
              placeholder={t('Enter company name')}
              required
            />
            <InputError message={fieldError(errors, 'company_name')} />
          </div>

          <MediaPicker
            id="company_logo"
            label={t('Company Logo')}
            value={data.company_logo}
            onChange={(value) =>
              setField('company_logo', Array.isArray(value) ? (value[0] ?? '') : value)
            }
            placeholder={t('Select company logo')}
          />
          <InputError message={fieldError(errors, 'company_logo')} />

          <div>
            <Label htmlFor="contact_person_name">{t('Contact Person')}</Label>
            <Input
              id="contact_person_name"
              value={data.contact_person_name}
              onChange={(e) => setField('contact_person_name', e.target.value)}
              placeholder={t('Enter contact person name')}
              required
            />
            <InputError message={fieldError(errors, 'contact_person_name')} />
          </div>

          <div>
            <Label htmlFor="contact_person_email">{t('Email')}</Label>
            <Input
              id="contact_person_email"
              type="email"
              value={data.contact_person_email}
              onChange={(e) => setField('contact_person_email', e.target.value)}
              placeholder={t('Enter email address')}
            />
            <InputError message={fieldError(errors, 'contact_person_email')} />
          </div>

          <PhoneInputComponent
            label={t('Mobile Number')}
            value={data.contact_person_mobile}
            onChange={(value) => setField('contact_person_mobile', value)}
            placeholder="+1234567890"
            error={fieldError(errors, 'contact_person_mobile')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax_number">{t('Tax Number')}</Label>
              <Input
                id="tax_number"
                value={data.tax_number}
                onChange={(e) => setField('tax_number', e.target.value)}
                placeholder={t('Enter tax number')}
              />
              <InputError message={fieldError(errors, 'tax_number')} />
            </div>
            {categories.length > 0 ? (
              <div>
                <Label htmlFor="category_id">
                  {isSupplier ? t('Supplier Category') : t('Customer Category')}
                </Label>
                <CategorySelect
                  id="category_id"
                  value={data.category_id}
                  options={categories}
                  onChange={(value) => setField('category_id', value)}
                />
                <InputError
                  message={
                    fieldError(errors, isSupplier ? 'supplier_category_id' : 'customer_category_id')
                  }
                />
              </div>
            ) : null}
            <div className={categories.length > 0 ? 'sm:col-span-2' : ''}>
              <Label htmlFor="payment_terms">{t('Payment Terms')}</Label>
              <PaymentTermsSelect
                id="payment_terms"
                value={data.payment_terms}
                options={paymentTerms}
                onChange={(value) => setField('payment_terms', value)}
                placeholder={t('Select payment terms')}
                emptyHint={
                  isSupplier
                    ? {
                        message: t('No procurement payment terms are configured yet.'),
                        setupPath: paths.procurement.systemSetupPaymentTerms,
                        setupLabel: t('Procurement payment terms setup'),
                      }
                    : {
                        message: t('No sales payment terms are configured yet.'),
                        setupPath: paths.sales.systemSetupPaymentTerms,
                        setupLabel: t('Sales payment terms setup'),
                      }
                }
              />
              {paymentTerms.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {isSupplier
                    ? t('Default applied to new purchase invoices when this supplier is selected.')
                    : t('Default applied to new sales invoices and orders when this customer is selected.')}
                </p>
              ) : null}
              <InputError message={fieldError(errors, 'payment_terms')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="credit_limit">{t('Credit limit')}</Label>
              <Input
                id="credit_limit"
                type="number"
                min={0}
                step="0.01"
                value={data.credit_limit}
                onChange={(e) => setField('credit_limit', e.target.value)}
                placeholder={t('Enter credit limit')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {isSupplier
                  ? t('Required before posting purchase invoices on credit terms. Available credit = limit minus closing AP balance.')
                  : t('Required before posting sales invoices on credit terms. Available credit = limit minus closing AR balance.')}
              </p>
              <InputError message={fieldError(errors, 'credit_limit')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <AddressSection
        title={t('Billing Address')}
        prefix="billing_address"
        address={data.billing_address}
        onAddressChange={(billing_address) => onChange({ ...data, billing_address })}
        errors={errors}
        required
      />

      <div className="flex items-center gap-2">
        <Checkbox
          id="same_as_billing"
          checked={data.same_as_billing}
          onCheckedChange={(checked) => handleSameAsBilling(checked === true)}
        />
        <Label htmlFor="same_as_billing">{t('Shipping address same as billing')}</Label>
      </div>

      {!data.same_as_billing ? (
        <AddressSection
          title={t('Shipping Address')}
          prefix="shipping_address"
          address={data.shipping_address}
          onAddressChange={(shipping_address) => onChange({ ...data, shipping_address })}
          errors={errors}
          required
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder={t('Enter notes')}
            rows={3}
          />
          <InputError message={fieldError(errors, 'notes')} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('Saving…') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
