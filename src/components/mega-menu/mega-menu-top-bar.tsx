import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { ActionableNotificationsBell, PortalNotificationsBell } from '@/components/actionable-notifications-bell'
import { NavUser } from '@/components/nav-user'
import { useAppContext } from '@/contexts/app-context'
import { useBrand } from '@/contexts/brand-context'
import { paths } from '@/lib/paths'
import { route } from '@/lib/route'
import { cn } from '@/lib/utils'
import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand-assets'
import { MEGA_MENU_CSS_VARS, MEGA_MENU_TOP_BAR_BG, MEGA_MENU_TOP_BAR_BORDER } from './mega-menu-styles'

type MegaMenuTopBarProps = {
  isMobile?: boolean
  mobileMenuTrigger?: ReactNode
  className?: string
}

export function MegaMenuTopBar({ isMobile = false, mobileMenuTrigger, className }: MegaMenuTopBarProps) {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const { settings, getPreviewUrl } = useBrand()
  const isClientUser = auth.user?.type === 'customer'

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const currentLogo = isDark ? settings.logo_light : settings.logo_dark
  const displayUrl = currentLogo ? getPreviewUrl(currentLogo) : DEFAULT_BRAND_LOGO_URL
  const firstName = auth.user?.name?.split(' ')[0] ?? auth.user?.name ?? ''

  return (
    <div
      className={cn(
        'flex h-14 w-full items-center justify-between gap-4 border-b px-4 md:px-6 lg:px-8',
        MEGA_MENU_TOP_BAR_BG,
        MEGA_MENU_TOP_BAR_BORDER,
        settings.layoutDirection === 'rtl' && 'flex-row-reverse',
        className,
      )}
      style={MEGA_MENU_CSS_VARS}
      dir={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
    >
      <div className="flex shrink-0 items-center">
        <Link
          to={isClientUser ? paths.portal.dashboard : route('dashboard')}
          className="flex shrink-0 items-center"
        >
          <img
            src={displayUrl}
            alt={settings.titleText || 'DownstreamX'}
            className={cn('w-auto object-contain', isMobile ? 'max-h-10 max-w-[180px]' : 'max-h-14 max-w-[280px]')}
          />
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">| DownstreamX v1.06</span>
      </div>

      <div
        className={cn(
          'flex min-w-0 items-center gap-2 sm:gap-3',
          settings.layoutDirection === 'rtl' && 'flex-row-reverse',
        )}
      >
        {auth.user ? (
          <p className="hidden truncate text-sm text-muted-foreground md:block">
            {t('Welcome')},{' '}
            <span className="font-medium text-foreground">{firstName}</span>
          </p>
        ) : null}

        {isClientUser ? <PortalNotificationsBell /> : <ActionableNotificationsBell />}

        {auth.user ? <NavUser user={auth.user} inHeader megaMenu /> : null}

        {mobileMenuTrigger}
      </div>
    </div>
  )
}
