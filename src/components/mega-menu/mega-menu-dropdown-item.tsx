import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { NavigationMenuItem } from '@/components/ui/navigation-menu'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'
import { MegaMenuTriggerTile, MEGA_MENU_TILE_WIDTH } from './mega-menu-item'
import { MegaMenuPanel } from './mega-menu-panel'
import { MEGA_MENU_GRADIENT_BG, megaMenuDropdownSurfaceStyle } from './mega-menu-styles'
import { MegaMenuNavigationMenuContent } from './mega-menu-navigation-content'
import { shouldUseFullWidthMegaMenuDropdown } from './mega-menu-utils'

const DROPDOWN_BASE_CLASS =
  'absolute top-full z-[100] mt-0 overflow-visible border border-primary/20 p-0 shadow-lg'

type MegaMenuDropdownItemProps = {
  item: NavItem
  isActive: boolean
  hideDivider: boolean
  containerRef: RefObject<HTMLDivElement | null>
}

function useMegaMenuDropdownStyle(
  fullWidth: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  anchorRef: RefObject<HTMLDivElement | null>,
) {
  const [style, setStyle] = useState<CSSProperties>({})

  const updateStyle = useCallback(() => {
    if (!fullWidth) {
      setStyle({ left: 0, width: 'max-content' })
      return
    }

    const container = containerRef.current
    const anchor = anchorRef.current
    if (!container || !anchor) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    const anchorRect = anchor.getBoundingClientRect()

    setStyle({
      left: containerRect.left - anchorRect.left,
      width: containerRect.width,
    })
  }, [anchorRef, containerRef, fullWidth])

  useLayoutEffect(() => {
    updateStyle()

    const container = containerRef.current
    const anchor = anchorRef.current
    if (!container || !anchor) {
      return
    }

    const observer = new ResizeObserver(() => {
      updateStyle()
    })

    observer.observe(container)
    observer.observe(anchor)
    window.addEventListener('resize', updateStyle)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateStyle)
    }
  }, [anchorRef, containerRef, updateStyle])

  return style
}

export function MegaMenuDropdownItem({
  item,
  isActive,
  hideDivider,
  containerRef,
}: MegaMenuDropdownItemProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const fullWidth = shouldUseFullWidthMegaMenuDropdown(item)
  const dropdownStyle = useMegaMenuDropdownStyle(fullWidth, containerRef, anchorRef)

  return (
    <NavigationMenuItem
      value={item.title}
      className="relative flex h-full shrink-0"
      style={{ width: MEGA_MENU_TILE_WIDTH }}
    >
      <div ref={anchorRef} className="flex h-full w-full flex-col">
        <MegaMenuTriggerTile item={item} isActive={isActive} hideDivider={hideDivider} />
      </div>
      <MegaMenuNavigationMenuContent
        className={cn(
          DROPDOWN_BASE_CLASS,
          MEGA_MENU_GRADIENT_BG,
          fullWidth ? 'rounded-none rounded-b-xl' : 'w-max rounded-b-xl',
        )}
        style={megaMenuDropdownSurfaceStyle(dropdownStyle)}
      >
        <MegaMenuPanel item={item} fullWidth={fullWidth} surface="transparent" />
      </MegaMenuNavigationMenuContent>
    </NavigationMenuItem>
  )
}
