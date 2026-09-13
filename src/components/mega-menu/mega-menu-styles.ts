import type { CSSProperties } from 'react'

/** Brand-aware gradient stops for mega menu surfaces. */
export const MEGA_MENU_CSS_VARS: CSSProperties = {
  '--mega-menu-hover-top': 'hsl(var(--primary))',
  '--mega-menu-hover-bottom': 'hsl(var(--mega-menu-primary-dark))',
  '--mega-menu-active-top': 'hsl(var(--mega-menu-primary-deep))',
  '--mega-menu-active-bottom': 'hsl(var(--mega-menu-primary-dark))',
} as CSSProperties

export const MEGA_MENU_GRADIENT =
  'linear-gradient(180deg, var(--mega-menu-hover-top) 0%, var(--mega-menu-hover-bottom) 100%)'

export const MEGA_MENU_ACTIVE_GRADIENT =
  'linear-gradient(180deg, var(--mega-menu-active-top) 0%, var(--mega-menu-active-bottom) 100%)'

export const MEGA_MENU_GRADIENT_BG =
  'bg-[linear-gradient(180deg,var(--mega-menu-hover-top)_0%,var(--mega-menu-hover-bottom)_100%)]'

export const MEGA_MENU_ACTIVE_GRADIENT_BG =
  'bg-[linear-gradient(180deg,var(--mega-menu-active-top)_0%,var(--mega-menu-active-bottom)_100%)]'

/** Solid complementary strip for logo / welcome / utilities above primary nav. */
export const MEGA_MENU_TOP_BAR_BG = 'bg-section text-section-foreground dark:bg-muted dark:text-foreground'

export const MEGA_MENU_TOP_BAR_BORDER = 'border-primary/20'

export function megaMenuDropdownSurfaceStyle(extra?: CSSProperties): CSSProperties {
  return {
    ...MEGA_MENU_CSS_VARS,
    backgroundImage: MEGA_MENU_GRADIENT,
    backgroundColor: 'transparent',
    color: 'hsl(var(--primary-foreground))',
    ...extra,
  }
}

/** @deprecated Use megaMenuDropdownSurfaceStyle() */
export const MEGA_MENU_DROPDOWN_SURFACE_STYLE = megaMenuDropdownSurfaceStyle()
