import { useQuery } from '@tanstack/react-query'
import {
  fetchDistributionMeta,
  toCustomerLookupOptions,
  toDriverLookupOptions,
  toProductLookupOptions,
  toTruckLookupOptions,
  type DistributionMeta,
  type DistributionMetaParams,
  type LookupOption,
} from '@/features/_shared/operations-lookups'
import { formatQuantity } from '@/lib/format-quantity'
import { fetchDistributionIndexMeta } from '../distribution-api'

function depotLabel(d: DistributionMeta['depots'][0]) {
  return d.city ? `${d.name} (${d.city})` : d.name
}

function truckLabel(v: DistributionMeta['trucks'][0]) {
  const capacity = v.capacity_litres ?? v.fuel_capacity
  const parts: string[] = [v.plate_number, v.make].filter((x): x is string => Boolean(x))
  if (capacity != null && Number(capacity) > 0) {
    parts.push(formatQuantity(capacity, { unit: 'L' }))
  }
  return parts.length > 0 ? parts.join(' - ') : `#${v.id}`
}

function userLabel(u: { name: string; email?: string }) {
  return u.email ? `${u.name} (${u.email})` : u.name
}

function driverLabel(u: { name: string }) {
  return u.name
}

function scheduleLabel(s: DistributionMeta['loading_schedules'][0]) {
  return s.schedule_number
    ? `${s.schedule_number} · ${s.scheduled_date ?? ''}`
    : `#${s.id}`
}

function deliveryScheduleLabel(s: {
  id: number
  delivery_number?: string
  scheduled_at?: string
}) {
  return s.delivery_number
    ? `${s.delivery_number} · ${s.scheduled_at ?? ''}`
    : `#${s.id}`
}

function transitLabel(t: DistributionMeta['transits'][0]) {
  return t.transit_number
    ? `${t.transit_number} (${t.status ?? ''})`
    : `Transit #${t.id}`
}

export type DistributionLookupKey =
  | 'depot'
  | 'product'
  | 'truck'
  | 'driver'
  | 'customer'
  | 'loading_schedule'
  | 'transit'
  | 'movement_type'
  | 'truck_load'
  | 'depot_rep'
  | 'delivery_schedule'
  | 'delivery_confirmation'

export function useDistributionMeta(params?: DistributionMetaParams) {
  const trucksStatusKey = params?.trucks_operational_status ?? 'all'
  const query = useQuery({
    queryKey: ['distribution', 'create-meta', trucksStatusKey],
    queryFn: () => fetchDistributionMeta(params),
    staleTime: 60_000,
  })

  const scheduleMetaQuery = useQuery({
    queryKey: ['distribution', 'loading-schedules', 'index-meta'],
    queryFn: () => fetchDistributionIndexMeta('/distribution/loading-schedules'),
    staleTime: 60_000,
  })

  const confirmationMetaQuery = useQuery({
    queryKey: ['distribution', 'delivery-confirmations', 'index-meta'],
    queryFn: () => fetchDistributionIndexMeta('/distribution/delivery-confirmations'),
    staleTime: 60_000,
  })

  const scheduleMeta = scheduleMetaQuery.data
  const confirmationMeta = confirmationMetaQuery.data

  const meta = query.data

  const optionsFor = (key: DistributionLookupKey): LookupOption[] => {
    if (!meta) return []
    switch (key) {
      case 'depot':
        return meta.depots.map((d) => ({ id: d.id, label: depotLabel(d) }))
      case 'product':
        return toProductLookupOptions(
          meta.products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            image: p.image,
          })),
        )
      case 'truck':
        return toTruckLookupOptions(
          meta.trucks.map((v) => ({
            id: v.id,
            plate_number: v.plate_number,
            make: v.make,
            truck_model: v.truck_model,
            avatar: v.avatar,
          })),
        ).map((opt) => {
          const truck = meta.trucks.find((v) => v.id === opt.id)
          return truck ? { ...opt, label: truckLabel(truck) } : opt
        })
      case 'driver':
        return toDriverLookupOptions(
          meta.drivers.map((d) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            avatar: d.avatar,
          })),
        ).map((opt) => {
          const driver = meta.drivers.find((d) => d.id === opt.id)
          return driver ? { ...opt, label: driverLabel(driver) } : opt
        })
      case 'customer':
        return toCustomerLookupOptions(meta.customers)
      case 'loading_schedule':
        return meta.loading_schedules.map((s) => ({ id: s.id, label: scheduleLabel(s) }))
      case 'transit':
        return meta.transits.map((t) => ({ id: t.id, label: transitLabel(t) }))
      case 'movement_type':
        return (meta.inventory_movement_types ?? []).map((t) => ({
          id: t.id,
          label: t.code ? `${t.name} (${t.code})` : t.name,
        }))
      case 'truck_load': {
        const loads = scheduleMeta?.truck_loads ?? []
        return loads.map((load) => {
          const number = load.load_number
          const status = load.phase
          return {
            id: load.id,
            label: number ? `${number}${status ? ` (${status})` : ''}` : `#${load.id}`,
          }
        })
      }
      case 'depot_rep':
        return (scheduleMeta?.depot_reps ?? []).map((u) => ({
          id: u.id,
          label: userLabel({
            name: [u.first_name, u.last_name].filter(Boolean).join(' '),
            email: u.email,
          }) || `#${u.id}`,
        }))
      case 'delivery_schedule':
        return (confirmationMeta?.delivery_schedules ?? []).map((s) => ({
          id: s.id,
          label: deliveryScheduleLabel(s),
        }))
      case 'delivery_confirmation':
        return []
      default:
        return []
    }
  }

  return {
    ...query,
    meta,
    optionsFor,
    isLoading: query.isLoading || scheduleMetaQuery.isLoading || confirmationMetaQuery.isLoading,
  }
}
