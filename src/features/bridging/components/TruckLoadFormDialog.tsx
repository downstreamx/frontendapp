import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatQuantity } from '@/lib/format-quantity'
import { createZodResolver } from '@/lib/form/zod-resolver'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import InputError from '@/components/ui/input-error'
import type { DistributionMeta } from '@/features/_shared/operations-lookups'
import { useDistributionMeta } from '@/features/distribution/hooks/use-distribution-meta'
import { resolveTruckCapacityLitres } from '../bridging-truck-capacity'
import type { CustomerStockBalance, BulkStorePurchaseTruckLoadPayload } from '../bridging-api'
import {
  bulkStoreTruckLoadFormSchema,
  parseStoreTruckLoadQuantity,
  type BulkStoreTruckLoadFormValues,
} from '../schemas'
import { TruckMultiSelectList, type TruckMultiSelectItem } from './TruckMultiSelectList'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entitlements: CustomerStockBalance[]
  defaultLoadingDepotId?: number | null
  isPending?: boolean
  dialogTitle?: string
  submitLabel?: string
  onSubmit: (payload: BulkStorePurchaseTruckLoadPayload) => void
}

const today = new Date().toISOString().slice(0, 10)

const emptyValues: BulkStoreTruckLoadFormValues = {
  entitlement_id: '',
  loading_depot_id: '',
  loading_date: today,
  destination: '',
  waybill_number: '',
  meter_number: '',
  notes: '',
}

function driverNameForTruck(
  truck: { default_driver_id?: number | null },
  drivers: Array<{ id: number; name: string }>,
): string | null {
  if (!truck.default_driver_id) return null
  const driver = drivers.find((d) => d.id === truck.default_driver_id)
  return driver?.name ?? null
}

export function TruckLoadFormDialog({
  open,
  onOpenChange,
  entitlements,
  defaultLoadingDepotId,
  isPending,
  dialogTitle,
  submitLabel,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const { meta, optionsFor } = useDistributionMeta({ trucks_operational_status: 'empty_unbridged' })

  const form = useForm<BulkStoreTruckLoadFormValues>({
    resolver: createZodResolver(bulkStoreTruckLoadFormSchema),
    defaultValues: emptyValues,
  })

  const [selectedTruckIds, setSelectedTruckIds] = useState<number[]>([])
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [truckSelectionError, setTruckSelectionError] = useState<string | null>(null)
  const [truckSearch, setTruckSearch] = useState('')

  const entitlementId = form.watch('entitlement_id')
  const selectedEntitlement = entitlements.find((e) => String(e.id) === entitlementId)

  const allTruckItems: TruckMultiSelectItem[] = useMemo(() => {
    if (!meta) return []
    return meta.trucks.map((truck) => {
      const capacity = resolveTruckCapacityLitres(truck)
      const driver = driverNameForTruck(truck, meta.drivers)
      const sublabel = [
        capacity > 0 ? formatQuantity(capacity, { unit: 'L' }) : null,
        driver ? `${t('Driver')}: ${driver}` : t('No default driver'),
      ]
        .filter(Boolean)
        .join(' · ')
      return {
        id: truck.id,
        label: [truck.plate_number, truck.make].filter(Boolean).join(' · ') || `#${truck.id}`,
        sublabel,
        capacityLitres: capacity,
        image: truck.avatar,
        mediaKind: 'truck' as const,
      }
    })
  }, [meta, t])

  const trucksById = useMemo(() => {
    const map = new Map<number, DistributionMeta['trucks'][0]>()
    for (const truck of meta?.trucks ?? []) {
      map.set(truck.id, truck)
    }
    return map
  }, [meta])

  const truckItems = useMemo(() => {
    const query = truckSearch.trim().toLowerCase()
    if (!query) return allTruckItems

    return allTruckItems.filter((item) => {
      const truck = trucksById.get(item.id)
      if (!truck) return false
      const plate = (truck.plate_number ?? '').toLowerCase()
      const make = (truck.make ?? '').toLowerCase()
      const capacity = String(resolveTruckCapacityLitres(truck))
      return plate.includes(query) || make.includes(query) || capacity.includes(query)
    })
  }, [allTruckItems, truckSearch, trucksById])

  const defaultQuantitiesForSelection = (ids: number[]): Record<number, string> => {
    const next: Record<number, string> = {}
    for (const id of ids) {
      const truck = trucksById.get(id)
      const capacity = truck ? resolveTruckCapacityLitres(truck) : 0
      next[id] = capacity > 0 ? String(capacity) : ''
    }
    return next
  }

  useEffect(() => {
    if (!open) return
    const first = entitlements.find((e) => e.balance_qty > 0) ?? entitlements[0]
    form.reset({
      ...emptyValues,
      entitlement_id: first ? String(first.id) : '',
      loading_depot_id: defaultLoadingDepotId
        ? String(defaultLoadingDepotId)
        : first?.depot_id
          ? String(first.depot_id)
          : '',
    })
    setSelectedTruckIds([])
    setQuantities({})
    setTruckSelectionError(null)
    setTruckSearch('')
  }, [open, entitlements, defaultLoadingDepotId, form])

  const handleTruckSelectionChange = (ids: number[]) => {
    setSelectedTruckIds(ids)
    setQuantities(defaultQuantitiesForSelection(ids))
    setTruckSelectionError(null)
  }

  const totalSelectedQty = useMemo(() => {
    let sum = 0
    for (const id of selectedTruckIds) {
      const parsed = parseStoreTruckLoadQuantity(quantities[id] ?? '')
      if (parsed != null) sum += parsed
    }
    return sum
  }, [selectedTruckIds, quantities])

  const assignedDriversLabel = useMemo(() => {
    const names = selectedTruckIds
      .map((id) => {
        const truck = trucksById.get(id)
        return truck ? driverNameForTruck(truck, meta?.drivers ?? []) : null
      })
      .filter((name): name is string => Boolean(name))
    const unique = [...new Set(names)]
    if (unique.length === 0) {
      return selectedTruckIds.length > 0 ? t('Default drivers will be applied per truck.') : null
    }
    return unique.join(', ')
  }, [selectedTruckIds, trucksById, meta?.drivers, t])

  const handleSubmit = form.handleSubmit((values) => {
    if (selectedTruckIds.length === 0) {
      setTruckSelectionError(t('Select at least one truck.'))
      return
    }

    const loads: { truck_id: number; quantity: number }[] = []
    for (const truckId of selectedTruckIds) {
      const parsed = parseStoreTruckLoadQuantity(quantities[truckId] ?? '')
      if (parsed == null || parsed <= 0) {
        setTruckSelectionError(t('Enter a valid quantity for each selected truck.'))
        return
      }
      loads.push({ truck_id: truckId, quantity: parsed })
    }

    const total = loads.reduce((sum, line) => sum + line.quantity, 0)
    if (selectedEntitlement != null && total > selectedEntitlement.balance_qty) {
      setTruckSelectionError(t('Total quantity exceeds entitlement balance.'))
      return
    }

    onSubmit({
      supplier_product_entitlement_id: Number(values.entitlement_id),
      loading_depot_id: Number(values.loading_depot_id),
      loading_date: values.loading_date,
      destination: values.destination.trim(),
      waybill_number: values.waybill_number?.trim() || undefined,
      meter_number: values.meter_number?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      loads,
    })
  })

  const depots = optionsFor('depot')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle ?? t('Add bridging record')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Product entitlement')} *</Label>
            <Select
              value={entitlementId || undefined}
              onValueChange={(value) => form.setValue('entitlement_id', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select entitlement')} />
              </SelectTrigger>
              <SelectContent>
                {entitlements.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.product?.name ?? t('Product')} — {t('Balance')}:{' '}
                    {formatQuantity(row.balance_qty)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={form.formState.errors.entitlement_id?.message} />
            {selectedEntitlement ? (
              <p className="text-xs text-muted-foreground">
                {t('Available balance')}: {formatQuantity(selectedEntitlement.balance_qty)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('Trucks')} *</Label>
            <Input
              value={truckSearch}
              onChange={(event) => setTruckSearch(event.target.value)}
              placeholder={t('Search by plate number, make, or fuel capacity')}
            />
            <TruckMultiSelectList
              items={truckItems}
              selectedIds={selectedTruckIds}
              onSelectionChange={handleTruckSelectionChange}
              quantities={quantities}
              onQuantityChange={(id, value) => {
                setQuantities((prev) => ({ ...prev, [id]: value }))
                setTruckSelectionError(null)
              }}
              emptyMessage={t('No empty trucks available. Register trucks in Fleet first.')}
            />
            <InputError message={truckSelectionError ?? undefined} />
            {selectedTruckIds.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('Total selected')}: {formatQuantity(totalSelectedQty)}
                {selectedEntitlement
                  ? ` / ${formatQuantity(selectedEntitlement.balance_qty)} ${t('balance')}`
                  : null}
              </p>
            ) : null}
            {assignedDriversLabel ? (
              <p className="text-xs text-muted-foreground">
                {t('Assigned driver(s)')}: {assignedDriversLabel}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('Loading depot')} *</Label>
              <Select
                value={form.watch('loading_depot_id') || undefined}
                onValueChange={(value) =>
                  form.setValue('loading_depot_id', value, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select depot')} />
                </SelectTrigger>
                <SelectContent>
                  {depots.map((opt) => (
                    <SelectItem key={String(opt.id)} value={String(opt.id)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError message={form.formState.errors.loading_depot_id?.message} />
            </div>
            <div className="space-y-2">
              <Label>{t('Loading date')} *</Label>
              <Input type="date" {...form.register('loading_date')} />
              <InputError message={form.formState.errors.loading_date?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('Destination')} *</Label>
            <Input {...form.register('destination')} />
            <InputError message={form.formState.errors.destination?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('Waybill number')}</Label>
              <Input {...form.register('waybill_number')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Meter number')}</Label>
              <Input {...form.register('meter_number')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('Notes')}</Label>
            <Textarea {...form.register('notes')} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('Saving...') : submitLabel ?? t('Create bridging')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
