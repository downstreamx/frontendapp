import type { PurchaseBridgingStatus, SalesDistributionStatus } from './types'
import { commercialInvoiceGoldenPanelClass } from '@/features/commercial/commercial-page-styles'

type Translate = (key: string) => string

const bridgingBadgeClasses: Record<PurchaseBridgingStatus, string> = {
  not_eligible:
    'inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
  unbridged:
    'inline-flex rounded-full bg-[var(--brand-orange-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-orange)]',
  partially_bridged:
    'inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  fully_bridged:
    'inline-flex rounded-full bg-[var(--brand-green-soft)] px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
}

export function purchaseBridgingStatusLabel(status: string | undefined, t: Translate): string {
  const labels: Record<string, string> = {
    not_eligible: t('Not eligible'),
    unbridged: t('Unbridged'),
    partially_bridged: t('Partially bridged'),
    fully_bridged: t('Fully bridged'),
  }
  return labels[status ?? ''] ?? status ?? '—'
}

export function purchaseBridgingStatusBadgeClass(status: string | undefined): string {
  if (status && status in bridgingBadgeClasses) {
    return bridgingBadgeClasses[status as PurchaseBridgingStatus]
  }
  return bridgingBadgeClasses.unbridged
}

export const TRUCK_LOAD_PHASE_LABELS: Record<string, string> = {
  awaiting_load: 'Awaiting load',
  in_transit_bridged: 'In transit (bridged)',
  arrived: 'Arrived at depot',
  assigned: 'Assigned',
  in_transit_distribution: 'In transit (distribution)',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function truckLoadPhaseLabel(phase: string | undefined, t: Translate): string {
  if (!phase) return '—'
  const key = TRUCK_LOAD_PHASE_LABELS[phase]
  return key ? t(key) : phase
}

const distributionBadgeClasses: Record<SalesDistributionStatus, string> = {
  not_eligible:
    'inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
  undistributed:
    'inline-flex rounded-full bg-[var(--brand-orange-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-orange)]',
  partially_distributed:
    'inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
  fully_distributed:
    'inline-flex rounded-full bg-[var(--brand-green-soft)] px-2.5 py-0.5 text-xs font-medium text-accent-foreground',
}

export function salesDistributionStatusLabel(status: string | undefined, t: Translate): string {
  const labels: Record<string, string> = {
    not_eligible: t('Not eligible'),
    undistributed: t('Undistributed'),
    partially_distributed: t('Partially distributed'),
    fully_distributed: t('Fully distributed'),
  }
  return labels[status ?? ''] ?? status ?? '—'
}

export function salesDistributionStatusBadgeClass(status: string | undefined): string {
  if (status && status in distributionBadgeClasses) {
    return distributionBadgeClasses[status as SalesDistributionStatus]
  }
  return distributionBadgeClasses.undistributed
}

/** Cream panel (#f7e1b6) for purchase bridging / sales distribution on invoice views. */
export const operationalInvoicePanelCardClass = commercialInvoiceGoldenPanelClass

export type OperationalPanelAction =
  | 'distribute'
  | 'add_bridging'
  | 'provision'
  | 'apply_credit'
  | 'approve'
  | 'cancel'
  | 'confirm_delivery'
  | 'release'
  | 'retry'
  | 'view'
  | 'neutral'

/** Subtle tinted buttons for bridging / distribution operational panels. */
export function operationalPanelActionButtonClass(action: OperationalPanelAction): string {
  const base = 'shadow-none'
  switch (action) {
    case 'distribute':
    case 'add_bridging':
      return `${base} border-primary/35 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary`
    case 'provision':
    case 'apply_credit':
      return `${base} border-amber-500/35 bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 dark:text-amber-100`
    case 'approve':
    case 'confirm_delivery':
      return `${base} border-green-600/35 bg-green-600/10 text-green-800 hover:bg-green-600/20 dark:text-green-200`
    case 'cancel':
      return `${base} border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10`
    case 'release':
      return `${base} border-border bg-muted/60 text-foreground hover:bg-muted`
    case 'view':
      return `${base} border-border/70 bg-background/90 text-foreground hover:bg-muted/70`
    case 'retry':
      return `${base} border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10`
    default:
      return `${base} border-border/70 bg-background/90 text-foreground hover:bg-muted/70`
  }
}

const phaseChipClasses: Record<string, string> = {
  awaiting_load:
    'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  in_transit_bridged:
    'border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-100',
  arrived: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100',
  assigned: 'border-primary/30 bg-primary/10 text-primary',
  in_transit_distribution:
    'border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100',
  delivered: 'border-green-600/30 bg-green-600/10 text-green-800 dark:text-green-200',
  cancelled: 'border-border bg-muted/50 text-muted-foreground',
}

export function operationalPanelPhaseChipClass(phase: string): string {
  return (
    phaseChipClasses[phase] ??
    'border-border bg-muted/40 text-foreground'
  )
}
