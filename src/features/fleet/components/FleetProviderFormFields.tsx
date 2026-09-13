import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { getImagePath } from '@/utils/helpers'
import type { FleetProviderFormState } from '../fleet-provider-form-utils'

type ProviderKind = 'truck' | 'maintenance'

type Props = {
  kind: ProviderKind
  form: FleetProviderFormState
  setField: <K extends keyof FleetProviderFormState>(
    key: K,
    value: FleetProviderFormState[K],
  ) => void
  statuses: string[]
  providerTypes?: Array<{ id: number; name: string }>
}

export function FleetProviderFormFields({
  kind,
  form,
  setField,
  statuses,
  providerTypes = [],
}: Props) {
  const { t } = useTranslation()
  const isTruck = kind === 'truck'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>{t('Name')}</Label>
          <Input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        </div>
        {isTruck ? (
          <div className="space-y-1">
            <Label>{t('Provider type')}</Label>
            <Select
              value={form.provider_type_id || 'none'}
              onValueChange={(v) => setField('provider_type_id', v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('None')}</SelectItem>
                {providerTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1">
          <Label>{t('Tax ID')}</Label>
          <Input value={form.tax_id} onChange={(e) => setField('tax_id', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('Status')}</Label>
          <Select value={form.status} onValueChange={(v) => setField('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t('Contact person')}</Label>
          <Input
            value={form.contact_person_name}
            onChange={(e) => setField('contact_person_name', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Email')}</Label>
          <Input
            type="email"
            value={form.contact_email}
            onChange={(e) => setField('contact_email', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Phone')}</Label>
          <Input value={form.contact_phone} onChange={(e) => setField('contact_phone', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('Payment terms')}</Label>
          <Input value={form.payment_terms} onChange={(e) => setField('payment_terms', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('Rating')}</Label>
          <Input
            type="number"
            min={0}
            max={5}
            step="0.1"
            value={form.rating}
            onChange={(e) => setField('rating', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Contract start')}</Label>
          <DatePicker
            value={form.contract_start_date}
            onChange={(v) => setField('contract_start_date', v ?? '')}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Contract end')}</Label>
          <DatePicker
            value={form.contract_end_date}
            onChange={(v) => setField('contract_end_date', v ?? '')}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t('Address')}</Label>
        <Textarea
          value={form.contact_address}
          onChange={(e) => setField('contact_address', e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Description')}</Label>
        <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-2">
          <Label>{kind === 'maintenance' ? t('Logo') : t('Avatar')}</Label>
          {form.avatar ? (
            <img
              src={getImagePath(form.avatar)}
              alt=""
              className="h-16 w-16 rounded-lg border object-cover"
            />
          ) : null}
          <MediaPicker
            value={form.avatar}
            onChange={(value) =>
              setField('avatar', Array.isArray(value) ? (value[0] ?? '') : value)
            }
            placeholder={
              kind === 'maintenance' ? t('Select logo image...') : t('Select provider image...')
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.is_active}
            onCheckedChange={(checked) => setField('is_active', checked === true)}
          />
          {t('Active')}
        </label>
      </div>
    </div>
  )
}
