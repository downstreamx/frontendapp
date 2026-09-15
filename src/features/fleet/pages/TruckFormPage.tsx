import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { getImagePath } from '@/utils/helpers'
import {
  createTruck,
  fetchTruckCreateMeta,
  fetchTruckEditMeta,
  updateTruck,
} from '../fleet-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  formStateToPayload,
  initialTruckFormState,
  truckToFormState,
  type TruckFormState,
} from '../truck-form-utils'

function statusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function TruckFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<TruckFormState>(initialTruckFormState)
  const [hydrated, setHydrated] = useState(false)

  usePageChrome({
    pageTitle: isEdit ? t('Edit Truck') : t('Create Truck'),
    breadcrumbs: [
      { label: t('Fleet') },
      { label: t('Trucks'), url: paths.fleet.trucks },
      { label: isEdit ? t('Edit Truck') : t('Create Truck') },
    ],
  })

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['fleet', 'trucks', 'create-meta'],
    queryFn: fetchTruckCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['fleet', 'trucks', id, 'edit-meta'],
    queryFn: () => fetchTruckEditMeta(id!),
    enabled: isEdit,
  })

  const meta = isEdit ? editMeta : createMeta
  const isLoading = isEdit ? editLoading : createLoading

  useEffect(() => {
    if (!isEdit || !editMeta?.truck || hydrated) return
    setForm(truckToFormState(editMeta.truck))
    setHydrated(true)
  }, [editMeta, hydrated, isEdit])

  const setField = <K extends keyof TruckFormState>(key: K, value: TruckFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToPayload(form)
      return isEdit ? updateTruck(id!, payload) : createTruck(payload)
    },
    onSuccess: (result) => {
      toast.success(
        isEdit ? t('The truck details are updated successfully.') : t('The truck has been created successfully.'),
      )
      navigate(paths.fleet.truckShow(result.id))
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, isEdit ? t('Failed to update truck') : t('Failed to create truck')),
      ),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.plate_number.trim() || !form.provider_id) {
      toast.error(t('Plate number and provider are required'))
      return
    }
    saveMutation.mutate()
  }

  if (isLoading || (isEdit && !hydrated)) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  const statuses = meta?.statuses ?? []

  return (
    <Card className="max-w-3xl shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-6">
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
                  {(meta?.truck_providers ?? []).map((provider) => (
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
                onChange={(value) => setField('avatar', Array.isArray(value) ? value[0] ?? '' : value)}
                placeholder={t('Select truck image...')}
                showPreview={false}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.fleet.truckShow(id) : paths.fleet.trucks}>
                {t('Cancel')}
              </Link>
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? isEdit
                  ? t('Updating...')
                  : t('Creating...')
                : isEdit
                  ? t('Update')
                  : t('Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
