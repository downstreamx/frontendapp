import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'
import { MegaMenuLinkTile, MEGA_MENU_TILE_WIDTH } from './mega-menu-item'
import { MegaMenuDropdownItem } from './mega-menu-dropdown-item'
import { MegaMenuMore } from './mega-menu-more'
import { MEGA_MENU_CSS_VARS } from './mega-menu-styles'
import { getNavItemActiveState } from './mega-menu-utils'
import { useMegaMenuOverflow } from './use-mega-menu-overflow'

type MegaMenuBarProps = {
  items: NavItem[]
  className?: string
  isRtl?: boolean
}

export function MegaMenuBar({ items, className, isRtl = false }: MegaMenuBarProps) {
  const { pathname } = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { visibleItems, overflowItems, showMore } = useMegaMenuOverflow({
    items,
    containerRef,
    enabled: true,
  })

  const menuStyle = MEGA_MENU_CSS_VARS

  return (
    <div
      ref={containerRef}
      className={cn('relative flex min-w-0 flex-1 items-stretch self-stretch', className)}
      style={menuStyle}
    >
      <NavigationMenu viewport={false} delayDuration={0} className="relative z-10 flex min-w-0 max-w-none flex-1 items-stretch">
        <NavigationMenuList
          className={cn(
            'flex h-full min-w-0 flex-1 items-stretch justify-start gap-0 p-0',
            isRtl && 'flex-row-reverse',
          )}
        >
          {visibleItems.map((item, index) => {
            const isActive = getNavItemActiveState(pathname, item)
            const hideDivider = index === visibleItems.length - 1 && !showMore

            if (item.children && item.children.length > 0) {
              return (
                <MegaMenuDropdownItem
                  key={item.title}
                  item={item}
                  isActive={isActive}
                  hideDivider={hideDivider}
                  containerRef={containerRef}
                />
              )
            }

            return (
              <NavigationMenuItem
                key={item.title}
                value={item.title}
                className="flex h-full shrink-0"
                style={{ width: MEGA_MENU_TILE_WIDTH }}
              >
                <MegaMenuLinkTile item={item} isActive={isActive} hideDivider={hideDivider} />
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
      {showMore ? <MegaMenuMore items={overflowItems} className="shrink-0" /> : null}
    </div>
  )
}
