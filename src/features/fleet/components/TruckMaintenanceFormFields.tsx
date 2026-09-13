import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import type { LookupOption } from '@/features/_shared/operations-lookups'
import {
  MAINTENANCE_SERVICE_TYPES,
  type TruckMaintenanceFormState,
} from '../truck-maintenance-form-utils'

type Props = {
  form: TruckMaintenanceFormState
  setField: <K extends keyof TruckMaintenanceFormState>(
    key: K,
    value: TruckMaintenanceFormState[K],
  ) => void
  truckOptions: LookupOption[]
  providerOptions: LookupOption[]
  statuses: string[]
}

export function TruckMaintenanceFormFields({
  form,
  setField,
  truckOptions,
  providerOptions,
  statuses,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>{t('Truck')}</Label>
          <EntitySelect
            value={form.truck_id}
            onValueChange={(v) => setField('truck_id', v)}
            options={truckOptions}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Maintenance provider')}</Label>
          <EntitySelect
            value={form.provider_id}
            onValueChange={(v) => setField('provider_id', v)}
            options={providerOptions}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Service type')}</Label>
          <Select value={form.service_type} onValueChange={(v) => setField('service_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAINTENANCE_SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>{t('Start date')}</Label>
          <DatePicker value={form.start_date} onChange={(v) => setField('start_date', v ?? '')} />
        </div>
        <div className="space-y-1">
          <Label>{t('Completion date')}</Label>
          <DatePicker
            value={form.completion_date}
            onChange={(v) => setField('completion_date', v ?? '')}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Next service due')}</Label>
          <DatePicker
            value={form.nexts_service_due_date}
            onChange={(v) => setField('nexts_service_due_date', v ?? '')}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Odometer')}</Label>
          <Input
            type="number"
            value={form.odometer}
            onChange={(e) => setField('odometer', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Parts cost')}</Label>
          <CurrencyInput value={form.parts_cost} onChange={(v) => setField('parts_cost', v)} />
        </div>
        <div className="space-y-1">
          <Label>{t('Labor cost')}</Label>
          <CurrencyInput value={form.labor_cost} onChange={(v) => setField('labor_cost', v)} />
        </div>
        <div className="space-y-1">
          <Label>{t('Total cost')}</Label>
          <CurrencyInput value={form.total_cost} onChange={(v) => setField('total_cost', v)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t('Job description')}</Label>
        <Textarea
          value={form.job_description}
          onChange={(e) => setField('job_description', e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Parts replaced')}</Label>
        <Textarea
          value={form.parts_replaced}
          onChange={(e) => setField('parts_replaced', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
