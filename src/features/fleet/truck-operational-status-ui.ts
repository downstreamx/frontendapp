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
    'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  in_transit_bridged:
    'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200',
  loaded_bridged:
    'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200',
  arrived:
    'inline-flex rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  assigned_for_distribution:
    'inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  in_transit_distribution:
    'inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  in_transit:
    'inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  delivered_pending_release:
    'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200',
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
