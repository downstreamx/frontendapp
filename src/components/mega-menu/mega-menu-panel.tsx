import { Link, useLocation } from 'react-router-dom'
import type { NavItem } from '@/types'
import { isMenuPathActive } from '@/utils/menu-path'
import { cn } from '@/lib/utils'
import {
  MEGA_MENU_PANEL_COLUMN_WIDTH,
  MEGA_MENU_DROPDOWN_PANEL,
  MEGA_MENU_DROPDOWN_PANEL_LINK,
  MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
  MEGA_MENU_TILE_TEXT,
} from './mega-menu-item'
import { layoutMegaMenuColumns } from './mega-menu-utils'
import { MenuLucideIcon } from './mega-menu-icon'
import { megaMenuDropdownSurfaceStyle } from './mega-menu-styles'

type MegaMenuPanelProps = {
  item: NavItem
  className?: string
  fullWidth?: boolean
  /** When nested inside NavigationMenuContent that already paints the gradient. */
  surface?: 'gradient' | 'transparent'
}

function PanelLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const active = isMenuPathActive(pathname, item.href, { matchExact: item.matchExact })

  if (!item.href) {
    return (
      <span
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-2 text-primary-foreground/70',
          MEGA_MENU_TILE_TEXT,
        )}
      >
        <MenuLucideIcon item={item} className="shrink-0 text-inherit" />
        <span className="truncate">{item.title}</span>
      </span>
    )
  }

  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2',
        MEGA_MENU_TILE_TEXT,
        MEGA_MENU_DROPDOWN_PANEL_LINK,
        active && MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
      )}
    >
      <MenuLucideIcon item={item} className="shrink-0 text-inherit" />
      <span className="truncate">{item.title}</span>
    </Link>
  )
}

export function MegaMenuPanel({
  item,
  className,
  fullWidth = false,
  surface = 'gradient',
}: MegaMenuPanelProps) {
  const columns = layoutMegaMenuColumns(item.children ?? [])

  return (
    <div
      className={cn(
        surface === 'gradient' ? MEGA_MENU_DROPDOWN_PANEL : 'text-primary-foreground',
        'overflow-hidden px-10 py-6 after:block after:clear-both after:content-[""]',
        fullWidth ? 'w-full' : 'w-max',
        className,
      )}
      style={surface === 'gradient' ? megaMenuDropdownSurfaceStyle() : undefined}
    >
      {columns.map((columnItems, columnIndex) => (
        <div
          key={`${item.title}-column-${columnIndex}`}
          className="float-left flex flex-col gap-0.5"
          style={{ width: MEGA_MENU_PANEL_COLUMN_WIDTH }}
        >
          {columnItems.map((child) => (
            <PanelLink
              key={`${columnIndex}-${child.title}-${child.href ?? 'group'}`}
              item={child}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
