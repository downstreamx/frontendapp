import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Soft cream tile used on product / party / show detail grids. */
export const detailInfoTileClass =
  'rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/80 p-4'

/** Quiet surface for notes / related blocks on show pages. */
export const detailMutedBlockClass =
  'rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/60 p-4 text-sm text-muted-foreground'

export function DetailSectionHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('mb-4 text-lg font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h3>
  )
}

export function DetailInfoTile({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(detailInfoTileClass, className)}>
      {label ? <p className="mb-1 text-sm font-semibold text-foreground">{label}</p> : null}
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  )
}

export type DetailField = {
  label: string
  value?: ReactNode
}

/** Label/value grid for show pages (truck, HRM, truck load, etc.). */
export function DetailFieldGrid({
  fields,
  className,
}: {
  fields: DetailField[]
  className?: string
}) {
  const visible = fields.filter((field) => field.value != null && field.value !== '')
  if (visible.length === 0) return null

  return (
    <dl className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {visible.map((field) => (
        <div
          key={field.label}
          className="rounded-xl border border-border/30 bg-[hsl(var(--section-deep))]/50 px-3.5 py-3"
        >
          <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}
