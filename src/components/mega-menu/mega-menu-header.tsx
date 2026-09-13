import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMenuItems } from '@/utils/menu'
import { useBrand } from '@/contexts/brand-context'
import { MegaMenuTopBar } from './mega-menu-top-bar'
import { MegaMenuBar } from './mega-menu-bar'
import { MegaMenuMobileDrawer } from './mega-menu-mobile-drawer'
import { MEGA_MENU_CSS_VARS, MEGA_MENU_GRADIENT_BG } from './mega-menu-styles'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export function MegaMenuHeader() {
  const { t } = useTranslation()
  const menuItems = useMenuItems()
  const { settings } = useBrand()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isRtl = settings.layoutDirection === 'rtl'

  const mobileMenuTrigger = isMobile ? (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('Open menu')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isRtl ? 'right' : 'left'} className="w-[min(100vw-2rem,320px)] p-0">
        <SheetHeader className="border-b px-4 py-3 text-start">
          <SheetTitle>{t('Menu')}</SheetTitle>
        </SheetHeader>
        <MegaMenuMobileDrawer items={menuItems} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  ) : null

  return (
    <header
      className="sticky top-0 z-40 w-full overflow-visible bg-section shadow-sm dark:bg-muted"
      style={MEGA_MENU_CSS_VARS}
    >
      <MegaMenuTopBar isMobile={isMobile} mobileMenuTrigger={mobileMenuTrigger} />

      {!isMobile ? (
        <div
          className={cn(
            'flex min-h-[88px] w-full items-stretch border-b border-primary/20',
            MEGA_MENU_GRADIENT_BG,
            'text-primary-foreground',
            isRtl && 'flex-row-reverse',
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
          style={MEGA_MENU_CSS_VARS}
        >
          <MegaMenuBar items={menuItems} isRtl={isRtl} className="min-w-0 flex-1" />
        </div>
      ) : null}
    </header>
  )
}
