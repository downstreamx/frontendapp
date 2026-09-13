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
  createMaintenanceProvider,
  createTruckProvider,
  fetchMaintenanceProviderCreateMeta,
  fetchMaintenanceProviderEditMeta,
  fetchTruckProviderCreateMeta,
  fetchTruckProviderEditMeta,
  updateMaintenanceProvider,
  updateTruckProvider,
} from '../fleet-api'
import {
  formStateToProviderPayload,
  initialFleetProviderFormState,
  providerToFormState,
  type FleetProviderFormState,
} from '../fleet-provider-form-utils'

type ProviderKind = 'truck' | 'maintenance'

type Props = {
  kind: ProviderKind
}

export function TruckProviderFormPage() {
  return <FleetProviderFormPage kind="truck" />
}

export function MaintenanceProviderFormPage() {
  return <FleetProviderFormPage kind="maintenance" />
}

function FleetProviderFormPage({ kind }: Props) {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isTruck = kind === 'truck'
  const listPath = isTruck ? paths.fleet.truckProviders : paths.fleet.maintenanceProviders
  const showPath = isTruck ? paths.fleet.truckProviderShow : paths.fleet.maintenanceProviderShow

  const [form, setForm] = useState<FleetProviderFormState>(initialFleetProviderFormState)
  const [hydrated, setHydrated] = useState(false)

  usePageChrome({
    pageTitle: isEdit
      ? isTruck
        ? t('Edit Truck Provider')
        : t('Edit Maintenance Provider')
      : isTruck
        ? t('Create Truck Provider')
        : t('Create Maintenance Provider'),
    breadcrumbs: [
      { label: t('Fleet') },
      {
        label: isTruck ? t('Truck Providers') : t('Maintenance Providers'),
        url: listPath,
      },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['fleet', kind, 'providers', 'create-meta'],
    queryFn: isTruck ? fetchTruckProviderCreateMeta : fetchMaintenanceProviderCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['fleet', kind, 'providers', id, 'edit-meta'],
    queryFn: () =>
      isTruck
        ? fetchTruckProviderEditMeta(id!)
        : fetchMaintenanceProviderEditMeta(id!),
    enabled: isEdit,
  })

  const meta = isEdit ? editMeta : createMeta
  const isLoading = isEdit ? editLoading : createLoading
  const statuses = meta?.statuses ?? ['active']
  const providerTypes =
    isTruck && createMeta && 'truck_provider_types' in createMeta
      ? createMeta.truck_provider_types
      : isTruck && editMeta && 'truck_provider_types' in editMeta
        ? editMeta.truck_provider_types
        : []

  useEffect(() => {
    if (!isEdit || !editMeta?.provider || hydrated) return
    setForm(providerToFormState(editMeta.provider))
    setHydrated(true)
  }, [editMeta, hydrated, isEdit])

  const setField = <K extends keyof FleetProviderFormState>(key: K, value: FleetProviderFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToProviderPayload(form, isTruck)
      if (isEdit) {
        return isTruck
          ? updateTruckProvider(id!, payload)
          : updateMaintenanceProvider(id!, payload)
      }
      return isTruck ? createTruckProvider(payload) : createMaintenanceProvider(payload)
    },
    onSuccess: (result) => {
      toast.success(isEdit ? t('Provider updated') : t('Provider created'))
      navigate(showPath(result.id))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to save provider'))),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
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
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={listPath}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
