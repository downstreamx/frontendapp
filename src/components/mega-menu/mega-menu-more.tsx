import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'
import { MegaMenuPanel } from './mega-menu-panel'
import {
  MegaMenuTile,
  MEGA_MENU_DROPDOWN_LINK_HOVER,
  MEGA_MENU_DROPDOWN_PANEL_LINK,
  MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
  MEGA_MENU_TILE_TEXT,
  MEGA_MENU_TILE_WIDTH,
} from './mega-menu-item'
import { MEGA_MENU_GRADIENT_BG, megaMenuDropdownSurfaceStyle } from './mega-menu-styles'
import { getNavItemActiveState } from './mega-menu-utils'
import { MenuLucideIcon } from './mega-menu-icon'

type MegaMenuMoreProps = {
  items: NavItem[]
  className?: string
}

export function MegaMenuMore({ items, className }: MegaMenuMoreProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const hasActiveOverflow = items.some((item) => getNavItemActiveState(pathname, item))

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('shrink-0', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group/trigger flex h-full min-h-[88px] shrink-0 self-stretch focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ width: MEGA_MENU_TILE_WIDTH }}
          >
            <MegaMenuTile
              item={{ title: t('More'), icon: MoreHorizontal }}
              isActive={hasActiveOverflow}
              variant="more"
              hideDivider
              interactive
              className="h-full w-full cursor-pointer"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            'w-max min-w-[12rem] border-primary/20 p-1.5 text-primary-foreground',
            MEGA_MENU_GRADIENT_BG,
            MEGA_MENU_TILE_TEXT,
          )}
          style={megaMenuDropdownSurfaceStyle()}
        >
          {items.map((item) => {
            const isActive = getNavItemActiveState(pathname, item)

            if (item.children && item.children.length > 0) {
              return (
                <DropdownMenuSub key={item.title}>
                  <DropdownMenuSubTrigger
                    className={cn(
                      MEGA_MENU_TILE_TEXT,
                      MEGA_MENU_DROPDOWN_PANEL_LINK,
                      'focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white',
                      isActive && MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
                    )}
                  >
                    <MenuLucideIcon item={item} className="mr-2 text-inherit" />
                    {item.title}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className={cn('w-max max-w-none border-primary/20 p-0', MEGA_MENU_GRADIENT_BG)}
                    style={megaMenuDropdownSurfaceStyle()}
                  >
                    <MegaMenuPanel item={item} surface="transparent" />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            }

            return (
              <DropdownMenuItem
                key={item.title}
                asChild
                disabled={!item.href}
                className={cn(
                  MEGA_MENU_TILE_TEXT,
                  'focus:bg-white/10 focus:text-white',
                  isActive && MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
                )}
              >
                {item.href ? (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex w-full cursor-pointer items-center',
                      MEGA_MENU_DROPDOWN_LINK_HOVER,
                      MEGA_MENU_DROPDOWN_PANEL_LINK,
                      isActive && MEGA_MENU_DROPDOWN_PANEL_LINK_ACTIVE,
                    )}
                  >
                    <MenuLucideIcon item={item} className="mr-2 text-inherit" />
                    {item.title}
                  </Link>
                ) : (
                  <span>{item.title}</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
