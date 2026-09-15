import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { getImagePath } from '@/utils/helpers'
import type { TruckFormState } from '../truck-form-utils'

function statusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

type Props = {
  form: TruckFormState
  setField: <K extends keyof TruckFormState>(key: K, value: TruckFormState[K]) => void
  truckProviders: Array<{ id: number; name: string }>
  statuses: string[]
}

export function TruckFormFields({ form, setField, truckProviders, statuses }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="plate_number">{t('Plate Number')}</Label>
          <Input
            id="plate_number"
            value={form.plate_number}
            onChange={(e) => setField('plate_number', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>{t('Truck Provider')}</Label>
          <Select value={form.provider_id} onValueChange={(value) => setField('provider_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select Provider')} />
            </SelectTrigger>
            <SelectContent>
              {truckProviders.map((provider) => (
                <SelectItem key={provider.id} value={String(provider.id)}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t('Status')}</Label>
          <Select value={form.status} onValueChange={(value) => setField('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(statusLabel(status))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="truck_model">{t('Model')}</Label>
          <Input
            id="truck_model"
            value={form.truck_model}
            onChange={(e) => setField('truck_model', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="make">{t('Make')}</Label>
          <Input id="make" value={form.make} onChange={(e) => setField('make', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="color">{t('Colour')}</Label>
          <Input id="color" value={form.color} onChange={(e) => setField('color', e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="year">{t('Year')}</Label>
          <Input
            id="year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(e) => setField('year', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="capacity_litres">{t('Fuel Capacity')}</Label>
          <Input
            id="capacity_litres"
            value={form.capacity_litres}
            onChange={(e) => setField('capacity_litres', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="engine_size">{t('Engine Size')}</Label>
          <Input
            id="engine_size"
            value={form.engine_size}
            onChange={(e) => setField('engine_size', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="engine_hours">{t('Engine Hours')}</Label>
          <Input
            id="engine_hours"
            value={form.engine_hours}
            onChange={(e) => setField('engine_hours', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="axle_count">{t('Axle Count')}</Label>
          <Input
            id="axle_count"
            value={form.axle_count}
            onChange={(e) => setField('axle_count', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="current_odometer">{t('Current Odometer')}</Label>
          <Input
            id="current_odometer"
            value={form.current_odometer}
            onChange={(e) => setField('current_odometer', e.target.value)}
          />
        </div>
      </div>

      <CurrencyInput
        label={t('Purchase Price')}
        value={form.purchase_price}
        onChange={(value) => setField('purchase_price', value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t('Purchase Date')}</Label>
          <DatePicker
            value={form.purchase_date}
            onChange={(value) => setField('purchase_date', value)}
            placeholder={t('Select purchase date')}
          />
        </div>
        <div className="flex items-center gap-2 pt-8">
          <Checkbox
            id="is_active"
            checked={form.is_active}
            onCheckedChange={(checked) => setField('is_active', checked === true)}
          />
          <Label htmlFor="is_active">{t('Active')}</Label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="current_gps_lat">{t('GPS Latitude')}</Label>
          <Input
            id="current_gps_lat"
            value={form.current_gps_lat}
            onChange={(e) => setField('current_gps_lat', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="current_gps_lon">{t('GPS Longitude')}</Label>
          <Input
            id="current_gps_lon"
            value={form.current_gps_lon}
            onChange={(e) => setField('current_gps_lon', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="additional_info">{t('Additional Info')}</Label>
        <Textarea
          id="additional_info"
          rows={3}
          value={form.additional_info}
          onChange={(e) => setField('additional_info', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('Truck Image')}</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <img
            src={getImagePath(form.avatar || 'avatar.png')}
            alt=""
            className="h-24 w-24 rounded-lg border object-cover"
          />
          <MediaPicker
            value={form.avatar}
            onChange={(value) => setField('avatar', Array.isArray(value) ? (value[0] ?? '') : value)}
            placeholder={t('Select truck image...')}
            showPreview={false}
          />
        </div>
      </div>
    </div>
  )
}
