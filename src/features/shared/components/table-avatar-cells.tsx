import { useState } from 'react'
import { Image as ImageIcon, Truck, User as UserIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImagePath } from '@/utils/helpers'

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
} as const

type Size = keyof typeof avatarSizes

function hasImageSource(path?: string | null): boolean {
  return Boolean(path?.trim())
}

/** Renders image when available; shows fallback icon when missing or failed to load. */
export function TableAvatarMedia({
  src,
  alt = '',
  fallback: Fallback,
  iconClassName = 'h-4 w-4 text-muted-foreground',
  objectFit = 'cover',
  imageUrlPrefix,
}: {
  src?: string | null
  alt?: string
  fallback: LucideIcon
  iconClassName?: string
  objectFit?: 'cover' | 'contain'
  imageUrlPrefix?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = hasImageSource(src) && !failed

  if (!showImage) {
    return <Fallback className={iconClassName} aria-hidden />
  }

  return (
    <img
      src={getImagePath(src!, imageUrlPrefix)}
      alt={alt}
      className={cn(
        'h-full w-full',
        objectFit === 'contain' ? 'object-contain p-0.5' : 'object-cover',
      )}
      onError={() => setFailed(true)}
    />
  )
}

export function TableAvatarFrame({
  children,
  size = 'md',
  rounded = 'full',
  className,
}: {
  children: React.ReactNode
  size?: Size
  rounded?: 'full' | 'md'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden border bg-muted',
        avatarSizes[size],
        rounded === 'full' ? 'rounded-full' : 'rounded-md',
        className,
      )}
    >
      {children}
    </div>
  )
}

const userAvatarSizes = {
  sm: { frame: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { frame: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { frame: 'h-12 w-12', icon: 'h-6 w-6' },
  xl: { frame: 'h-24 w-24', icon: 'h-10 w-10' },
} as const

type UserAvatarSize = keyof typeof userAvatarSizes

/** User portrait with User icon fallback when the image is missing or fails to load. */
export function UserAvatar({
  avatar,
  name = '',
  size = 'md',
  rounded = 'full',
  className,
  iconClassName,
  imageUrlPrefix,
  bordered = true,
}: {
  avatar?: string | null
  name?: string
  size?: UserAvatarSize
  rounded?: 'full' | 'md'
  className?: string
  iconClassName?: string
  imageUrlPrefix?: string
  bordered?: boolean
}) {
  const dimensions = userAvatarSizes[size]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden bg-muted',
        dimensions.frame,
        rounded === 'full' ? 'rounded-full' : 'rounded-lg',
        bordered && 'border',
        className,
      )}
    >
      <TableAvatarMedia
        src={avatar}
        fallback={UserIcon}
        alt={name}
        iconClassName={cn('text-muted-foreground', dimensions.icon, iconClassName)}
        imageUrlPrefix={imageUrlPrefix}
      />
    </div>
  )
}

export function TableUserAvatarCell({
  avatar,
  name,
  size = 'md',
}: {
  avatar?: string | null
  name: string
  size?: Size
}) {
  return (
    <div className="flex items-center gap-2">
      <UserAvatar avatar={avatar} name={name} size={size} />
      <span>{name}</span>
    </div>
  )
}

export function TableProductAvatarCell({
  image,
  name,
  size = 'md',
}: {
  image?: string | null
  name: string
  size?: Size
}) {
  return (
    <div className="flex items-center gap-2">
      <TableAvatarFrame size={size} rounded="md">
        <TableAvatarMedia src={image} fallback={ImageIcon} alt={name} objectFit="contain" />
      </TableAvatarFrame>
      <span>{name}</span>
    </div>
  )
}

export function TableTruckAvatarCell({
  avatar,
  label,
  size = 'md',
  showLabel = true,
}: {
  avatar?: string | null
  label: string
  size?: Size
  showLabel?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <TableAvatarFrame size={size}>
        <TableAvatarMedia src={avatar} fallback={Truck} alt={label} />
      </TableAvatarFrame>
      {showLabel && label ? <span>{label}</span> : null}
    </div>
  )
}
