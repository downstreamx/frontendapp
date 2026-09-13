import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { toTruckLookupOptions } from '@/features/_shared/operations-lookups'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  createTruckMaintenance,
  fetchTruckMaintenanceCreateMeta,
  fetchTruckMaintenanceEditMeta,
  updateTruckMaintenance,
} from '../fleet-api'
import {
  formStateToMaintenancePayload,
  initialMaintenanceFormState,
  MAINTENANCE_SERVICE_TYPES,
  maintenanceToFormState,
  type TruckMaintenanceFormState,
} from '../truck-maintenance-form-utils'

export function TruckMaintenanceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<TruckMaintenanceFormState>(initialMaintenanceFormState)
  const [hydrated, setHydrated] = useState(false)

  usePageChrome({
    pageTitle: isEdit ? t('Edit Truck Maintenance') : t('Create Truck Maintenance'),
    breadcrumbs: [
      { label: t('Fleet') },
      { label: t('Truck Maintenances'), url: paths.fleet.truckMaintenances },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', 'create-meta'],
    queryFn: fetchTruckMaintenanceCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', id, 'edit-meta'],
    queryFn: () => fetchTruckMaintenanceEditMeta(id!),
    enabled: isEdit,
  })

  const meta = isEdit ? editMeta : createMeta
  const isLoading = isEdit ? editLoading : createLoading

  const truckOptions = useMemo(
    () => toTruckLookupOptions(meta?.trucks ?? []),
    [meta?.trucks],
  )

  const providerOptions = useMemo(
    () =>
      (meta?.maintenance_providers ?? []).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [meta?.maintenance_providers],
  )

  useEffect(() => {
    if (!isEdit || !editMeta?.maintenance || hydrated) return
    setForm(maintenanceToFormState(editMeta.maintenance))
    setHydrated(true)
  }, [editMeta, hydrated, isEdit])

  const setField = <K extends keyof TruckMaintenanceFormState>(
    key: K,
    value: TruckMaintenanceFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToMaintenancePayload(form)
      return isEdit
        ? updateTruckMaintenance(id!, payload)
        : createTruckMaintenance(payload)
    },
    onSuccess: (result) => {
      toast.success(isEdit ? t('Maintenance updated') : t('Maintenance recorded'))
      navigate(paths.fleet.truckMaintenanceShow(result.id))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to save maintenance'))),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }

  const statuses = meta?.statuses ?? ['scheduled']

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
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={paths.fleet.truckMaintenances}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
