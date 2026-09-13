import { Building2, Package, Truck, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImagePath } from '@/utils/helpers'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export type LookupMediaKind = 'truck' | 'driver' | 'product' | 'customer' | 'supplier'

const FALLBACK_ICON = {
  truck: Truck,
  driver: User,
  product: Package,
  customer: Users,
  supplier: Building2,
} as const

type MediaProps = {
  image?: string | null
  mediaKind?: LookupMediaKind
  className?: string
  alt?: string
}

export function LookupOptionMedia({ image, mediaKind = 'product', className, alt = '' }: MediaProps) {
  const src = image ? getImagePath(image) : ''
  const Fallback = FALLBACK_ICON[mediaKind]

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Fallback className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  )
}

export function LookupOptionLabel({ option }: { option: LookupOption }) {
  const showMedia = Boolean(option.image || option.mediaKind)

  if (!showMedia) {
    return <span className="truncate">{option.label}</span>
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <LookupOptionMedia image={option.image} mediaKind={option.mediaKind} alt={option.label} />
      <span className="truncate">{option.label}</span>
    </span>
  )
}
