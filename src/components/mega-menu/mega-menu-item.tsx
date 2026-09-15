import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/types'
import { MegaMenuIcon } from './mega-menu-icon'
import { MEGA_MENU_GRADIENT_BG } from './mega-menu-styles'

export const MEGA_MENU_TILE_WIDTH = 128
export const MEGA_MENU_PANEL_COLUMN_WIDTH = 220

export const MEGA_MENU_TILE_BASE =
  'relative flex h-full min-h-[88px] w-[128px] shrink-0 flex-col items-center justify-center gap-1.5 px-2.5 pb-3 pt-2.5 text-center transition-[background,color,box-shadow] duration-150'

export const MEGA_MENU_TILE_TEXT = 'text-sm font-medium leading-snug tracking-tight sm:text-[0.9375rem]'

export const MEGA_MENU_TILE_LABEL = `whitespace-nowrap ${MEGA_MENU_TILE_TEXT}`

export const MEGA_MENU_DROPDOWN_LINK_HOVER =
  'transition-colors hover:text-primary hover:[&_svg]:text-primary'

export const MEGA_MENU_DROPDOWN_PANEL = `${MEGA_MENU_GRADIENT_BG} text-primary-foreground`

export const MEGA_MENU_DROPDOWN_PANEL_LINK =
  'text-primary-foreground transition-colors hover:bg-white/10 hover:text-white [&_svg]:text-inherit'

export const MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE =
  'bg-white/15 font-semibold text-white [&_svg]:text-white'

/** Soft hairline between tiles — inset so it does not dominate the bar. */
export const MEGA_MENU_TILE_DIVIDER =
  'after:pointer-events-none after:absolute after:bottom-3.5 after:end-0 after:top-3.5 after:w-px after:bg-primary-foreground/[0.12]'

export const MEGA_MENU_TILE_MORE_IDLE =
  'bg-transparent text-primary-foreground [&_.mega-menu-icon-badge]:bg-black/10 [&_svg]:text-primary-foreground/90 group-hover/trigger:[&_.mega-menu-icon-badge]:bg-black/20 group-data-[state=open]/trigger:[&_.mega-menu-icon-badge]:bg-black/20'

export const MEGA_MENU_TILE_MORE_ACTIVE =
  'bg-transparent text-primary-foreground [&_.mega-menu-icon-badge]:bg-black/25 [&_svg]:text-primary-foreground'

/** Selected: highlight the circular icon only — never the rectangular tile. */
export const MEGA_MENU_TILE_GRADIENT =
  'bg-transparent text-primary-foreground [&_.mega-menu-icon-badge]:bg-white/20 [&_.mega-menu-nav-icon]:ring-white/45 [&_.mega-menu-nav-icon]:shadow-md [&_svg]:text-primary-foreground [&_span]:font-semibold'

export const MEGA_MENU_TILE_IDLE =
  'bg-transparent text-primary-foreground/90 [&_svg]:text-primary-foreground/85'

export const MEGA_MENU_TILE_INTERACTIVE =
  'group-hover/trigger:text-primary-foreground group-hover/trigger:[&_.mega-menu-icon-badge]:bg-white/15 group-hover/trigger:[&_.mega-menu-nav-icon]:ring-white/25 group-hover/trigger:[&_svg]:text-primary-foreground group-data-[state=open]/trigger:text-primary-foreground group-data-[state=open]/trigger:[&_.mega-menu-icon-badge]:bg-white/15 group-data-[state=open]/trigger:[&_.mega-menu-nav-icon]:ring-white/25 group-data-[state=open]/trigger:[&_svg]:text-primary-foreground'

type MegaMenuTileProps = {
  item: NavItem
  isActive: boolean
  interactive?: boolean
  variant?: 'default' | 'more'
  hideDivider?: boolean
  className?: string
}

export function MegaMenuTile({
  item,
  isActive,
  interactive = false,
  variant = 'default',
  hideDivider = false,
  className,
}: MegaMenuTileProps) {
  const isMore = variant === 'more'

  return (
    <div
      className={cn(
        MEGA_MENU_TILE_BASE,
        !hideDivider && MEGA_MENU_TILE_DIVIDER,
        isMore
          ? cn(MEGA_MENU_TILE_MORE_IDLE, isActive && MEGA_MENU_TILE_MORE_ACTIVE)
          : isActive
            ? MEGA_MENU_TILE_GRADIENT
            : MEGA_MENU_TILE_IDLE,
        !isMore && interactive && !isActive && MEGA_MENU_TILE_INTERACTIVE,
        className,
      )}
    >
      {isMore ? (
        <span
          className="mega-menu-icon-badge flex shrink-0 items-center justify-center rounded-full p-2 transition-[background] duration-150"
          aria-hidden
        >
          <MoreHorizontal className="h-10 w-10 shrink-0 transition-colors duration-150" strokeWidth={1.75} />
        </span>
      ) : (
        <MegaMenuIcon item={item} />
      )}
      <span className={MEGA_MENU_TILE_LABEL}>{item.title}</span>
    </div>
  )
}

type MegaMenuLinkTileProps = {
  item: NavItem
  isActive: boolean
  hideDivider?: boolean
  className?: string
}

export function MegaMenuLinkTile({ item, isActive, hideDivider, className }: MegaMenuLinkTileProps) {
  if (!item.href) {
    return <MegaMenuTile item={item} isActive={isActive} hideDivider={hideDivider} className={className} />
  }

  return (
    <Link
      to={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group/trigger flex h-full min-h-[88px] w-[128px] shrink-0 self-stretch focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <MegaMenuTile
        item={item}
        isActive={isActive}
        interactive
        hideDivider={hideDivider}
        className="h-full w-full"
      />
    </Link>
  )
}

type MegaMenuTriggerTileProps = {
  item: NavItem
  isActive: boolean
  hideDivider?: boolean
  className?: string
}

export function MegaMenuTriggerTile({ item, isActive, hideDivider, className }: MegaMenuTriggerTileProps) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(
        'group/trigger flex h-full min-h-[88px] w-[128px] shrink-0 self-stretch bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <MegaMenuTile
        item={item}
        isActive={isActive}
        interactive
        hideDivider={hideDivider}
        className="h-full w-full"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}
