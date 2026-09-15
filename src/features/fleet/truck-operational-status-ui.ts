export const TRUCK_OPERATIONAL_STATUSES = [
  'empty_unbridged',
  'in_transit_bridged',
  'arrived',
  'assigned_for_distribution',
  'in_transit_distribution',
  'delivered_pending_release',
  /** @deprecated Legacy alias */
  'loaded_bridged',
  /** @deprecated Legacy alias */
  'in_transit',
] as const

export type TruckOperationalStatus = (typeof TRUCK_OPERATIONAL_STATUSES)[number]

type Translate = (key: string) => string

const badgeClasses: Record<string, string> = {
  empty_unbridged:
    'inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
  in_transit_bridged:
    'inline-flex rounded-full bg-[var(--brand-green-soft)] px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  loaded_bridged:
    'inline-flex rounded-full bg-[var(--brand-green-soft)] px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  arrived:
    'inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  assigned_for_distribution:
    'inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  in_transit_distribution:
    'inline-flex rounded-full bg-[var(--brand-orange-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-orange)]',
  in_transit:
    'inline-flex rounded-full bg-[var(--brand-orange-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-orange)]',
  delivered_pending_release:
    'inline-flex rounded-full bg-[var(--brand-orange-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-orange)]',
}

const labels: Record<string, string> = {
  empty_unbridged: 'Empty / unbridged',
  in_transit_bridged: 'In transit (bridged)',
  loaded_bridged: 'In transit (bridged)',
  arrived: 'Arrived at depot',
  assigned_for_distribution: 'Assigned for distribution',
  in_transit_distribution: 'In transit (distribution)',
  in_transit: 'In transit (distribution)',
  delivered_pending_release: 'Delivered (pending release)',
}

export function truckOperationalStatusLabel(status: string | undefined | null, t: Translate): string {
  if (!status) return '—'
  const key = labels[status]
  return key ? t(key) : status.replaceAll('_', ' ')
}

export function truckOperationalStatusBadgeClass(status: string | undefined | null): string {
  if (status && status in badgeClasses) {
    return badgeClasses[status]
  }
  return badgeClasses.empty_unbridged
}
