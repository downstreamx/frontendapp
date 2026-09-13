import { CircleDot, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/types'
import { MEGA_MENU_TOP_ICONS_BY_PERMISSION } from './mega-menu-icon-map'
import { resolveMegaMenuNavIconSrc } from './mega-menu-nav-icons'

const FALLBACK_MENU_ICON = CircleDot

/** Resolve a Lucide icon for any nav item (top-level or dropdown). */
export function resolveMenuLucideIcon(item: NavItem): LucideIcon {
  if (item.icon) {
    return item.icon as LucideIcon
  }
  if (item.permission && MEGA_MENU_TOP_ICONS_BY_PERMISSION[item.permission]) {
    return MEGA_MENU_TOP_ICONS_BY_PERMISSION[item.permission]
  }
  return FALLBACK_MENU_ICON
}

type MenuLucideIconProps = {
  item: NavItem
  className?: string
  /** Inline icons for dropdown / mobile rows; tile for top-level mega menu. */
  size?: 'inline' | 'tile'
}

function MegaMenuNavImage({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={cn(
        'mega-menu-icon-badge flex shrink-0 items-center justify-center transition-[transform,box-shadow] duration-150',
        className,
      )}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        className="mega-menu-nav-icon h-14 w-14 rounded-full object-cover shadow-sm ring-2 ring-black/5"
      />
    </span>
  )
}

export function MenuLucideIcon({ item, className, size = 'inline' }: MenuLucideIconProps) {
  const navIconSrc = size === 'tile' ? resolveMegaMenuNavIconSrc(item) : null

  if (navIconSrc) {
    return <MegaMenuNavImage src={navIconSrc} className={className} />
  }

  const Icon = resolveMenuLucideIcon(item)

  if (size === 'tile') {
    return (
      <span
        className={cn(
          'mega-menu-icon-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] transition-colors duration-150',
          className,
        )}
        aria-hidden
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} absoluteStrokeWidth />
      </span>
    )
  }

  return (
    <Icon
      className={cn('h-4 w-4 shrink-0 text-muted-foreground', className)}
      strokeWidth={1.75}
      absoluteStrokeWidth
      aria-hidden
    />
  )
}

export function MegaMenuIcon({ item, className }: { item: NavItem; className?: string }) {
  return <MenuLucideIcon item={item} size="tile" className={className} />
}
