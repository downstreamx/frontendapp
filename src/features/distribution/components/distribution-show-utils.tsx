import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import type { DistributionRow } from '../distribution-api'

type NamedEntity = { id?: number; name?: string } | null | undefined
type TransitRef = {
  id?: number
  transit_number?: string
  status?: string
  from_depot?: NamedEntity
  to_depot?: NamedEntity
  fromDepot?: NamedEntity
  toDepot?: NamedEntity
}

export function formatFieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatFieldValue(key: string, value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key.includes('_at') || key.includes('date')) {
    try {
      return formatDate(String(value))
    } catch {
      return String(value)
    }
  }
  if (typeof value === 'number') return String(value)
  return String(value)
}

export function rowTitle(row: DistributionRow, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]
    if (val != null && val !== '') return String(val)
  }
  return `#${row.id}`
}

export function depotLink(depot: NamedEntity) {
  if (!depot?.id) return depot?.name ?? '—'
  return (
    <Link to={paths.depots.show(depot.id)} className="text-primary hover:underline">
      {depot.name}
    </Link>
  )
}

export function transitLink(transit: TransitRef) {
  if (!transit?.id) return transit?.transit_number ?? '—'
  return (
    <Link to={paths.distribution.transitShow(transit.id)} className="text-primary hover:underline">
      {transit.transit_number ?? `#${transit.id}`}
    </Link>
  )
}

export function loadingScheduleLink(row: { id?: number; schedule_number?: string }) {
  if (!row?.id) return row?.schedule_number ?? '—'
  return (
    <Link
      to={paths.distribution.loadingScheduleShow(row.id)}
      className="text-primary hover:underline"
    >
      {row.schedule_number ?? `#${row.id}`}
    </Link>
  )
}

export function truckDisplay(truck: Parameters<typeof truckLabel>[0], truckId?: number) {
  return truckLabel(truck, truckId)
}

type PersonRef = { first_name?: string; last_name?: string; email?: string } | null | undefined

export function personDisplayName(person: PersonRef): string {
  const name = [person?.first_name, person?.last_name].filter(Boolean).join(' ')
  return name || person?.email || '—'
}

export function resolveScheduleDestination(row: DistributionRow): string {
  const direct = row.destination
  if (direct != null && direct !== '') return String(direct)
  const truckLoad = (row.truck_load ?? row.truckLoad) as { destination?: string } | undefined
  if (truckLoad?.destination) return truckLoad.destination
  return '—'
}

/** @deprecated Use truckDisplay */
export const vehicleDisplay = truckDisplay

export type DetailItem = { label: string; value: ReactNode }

export function scalarDetails(
  row: DistributionRow,
  keys: string[],
  skip = new Set<string>(),
): DetailItem[] {
  return keys
    .filter((key) => !skip.has(key) && typeof row[key] !== 'object')
    .map((key) => ({
      label: formatFieldLabel(key),
      value: formatFieldValue(key, row[key]),
    }))
}
