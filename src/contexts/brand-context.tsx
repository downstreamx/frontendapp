import React, { createContext, useContext, type ReactNode, useEffect } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { hexToHslChannels, darkenHex } from '@/lib/color'
import { getImagePath } from '@/utils/helpers'

interface BrandSettings {
  logo_dark?: string
  logo_light?: string
  favicon?: string
  titleText?: string
  footerText?: string
  sidebarVariant?: string
  sidebarStyle?: string
  navigationLayout?: string
  layoutDirection?: string
  themeMode?: string
  themeColor?: string
  customColor?: string
}

interface BrandContextType {
  settings: BrandSettings
  getPreviewUrl: (path: string) => string
  getPrimaryColor: () => string
  getSidebarStyles: () => React.CSSProperties
  getSidebarClasses: () => string
  getCompleteSidebarProps: () => { style: React.CSSProperties; className: string }
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export function BrandProvider({ children }: { children: ReactNode }) {
  const { adminAllSetting, companyAllSetting, auth, imageUrlPrefix } = useAppContext()
  const isSuperAdmin = auth.roles.includes('superadmin')
  const globalSettings =
    !auth.user || isSuperAdmin ? adminAllSetting : companyAllSetting

  const settings: BrandSettings = {
    logo_dark: globalSettings?.logo_dark || '',
    logo_light: globalSettings?.logo_light || '',
    favicon: globalSettings?.favicon || '',
    titleText: globalSettings?.titleText || 'DownstreamX',
    footerText: globalSettings?.footerText || `© ${new Date().getFullYear()} DownstreamX`,
    sidebarVariant: globalSettings?.sidebarVariant || 'inset',
    sidebarStyle: globalSettings?.sidebarStyle || 'plain',
    navigationLayout: globalSettings?.navigationLayout || 'mega-menu',
    layoutDirection: globalSettings?.layoutDirection || 'ltr',
    themeMode: globalSettings?.themeMode || 'light',
    themeColor: globalSettings?.themeColor || 'green',
    customColor: globalSettings?.customColor || '#10b77f',
  }

  const getPreviewUrl = (path: string) => getImagePath(path, imageUrlPrefix)

  const themeColors = {
    blue: '#3b82f6',
    green: '#10b77f',
    purple: '#8b5cf6',
    orange: '#f97316',
    red: '#ef4444',
  }

  const getPrimaryColor = () =>
    settings.themeColor === 'custom'
      ? settings.customColor || '#10b77f'
      : themeColors[settings.themeColor as keyof typeof themeColors] || '#10b77f'

  useEffect(() => {
    const primaryColor = getPrimaryColor()
    const root = document.documentElement
    const isRTL = settings.layoutDirection === 'rtl'

    root.style.setProperty('--primary', hexToHslChannels(primaryColor))
    root.style.setProperty('--primary-foreground', '0 0% 98%')
    root.style.setProperty('--ring', hexToHslChannels(primaryColor))
    root.style.setProperty('--sidebar-primary', hexToHslChannels(primaryColor))
    root.style.setProperty('--mega-menu-primary-dark', hexToHslChannels(darkenHex(primaryColor, 0.88)))
    root.style.setProperty('--mega-menu-primary-deep', hexToHslChannels(darkenHex(primaryColor, 0.72)))

    root.classList.toggle('dark', settings.themeMode === 'dark')
    root.dir = isRTL ? 'rtl' : 'ltr'
    root.style.direction = isRTL ? 'rtl' : 'ltr'
    document.body.dir = isRTL ? 'rtl' : 'ltr'
    document.body.style.direction = isRTL ? 'rtl' : 'ltr'
    document.body.classList.toggle('rtl', isRTL)
    document.body.classList.toggle('ltr', !isRTL)

    let existingStyle = document.getElementById('brand-sidebar-styles')
    if (!existingStyle) {
      existingStyle = document.createElement('style')
      existingStyle.id = 'brand-sidebar-styles'
      document.head.appendChild(existingStyle)
    }

    if (settings.sidebarStyle === 'colored' || settings.sidebarStyle === 'gradient') {
      existingStyle.textContent = `
        [data-sidebar] [data-sidebar="menu-button"]:hover {
          background: rgba(255,255,255,0.1);
        }
        [data-sidebar] [data-sidebar="menu-button"][data-active="true"] {
          background: rgba(255,255,255,0.2);
        }
      `
    } else {
      existingStyle.textContent = ''
    }
  }, [
    settings.themeMode,
    settings.themeColor,
    settings.customColor,
    settings.layoutDirection,
    settings.sidebarStyle,
  ])

  const getSidebarStyles = (): React.CSSProperties => {
    const primaryColor = getPrimaryColor()

    if (settings.sidebarStyle === 'colored') {
      return { backgroundColor: primaryColor }
    }
    if (settings.sidebarStyle === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`,
      }
    }
    return {}
  }

  const getSidebarClasses = () => {
    if (settings.sidebarVariant === 'floating') {
      return 'm-2 rounded-lg shadow-sm'
    }
    return ''
  }

  const getCompleteSidebarProps = () => {
    const styles = getSidebarStyles()
    const classes = getSidebarClasses()
    const hasCustomBackground = Boolean(styles.backgroundColor || styles.background)

    return {
      style: {
        ...styles,
        ...(hasCustomBackground && {
          backgroundColor: styles.backgroundColor || 'transparent',
          background: styles.background || styles.backgroundColor || 'transparent',
        }),
      },
      className: classes,
    }
  }

  return (
    <BrandContext.Provider
      value={{
        settings,
        getPreviewUrl,
        getPrimaryColor,
        getSidebarStyles,
        getSidebarClasses,
        getCompleteSidebarProps,
      }}
    >
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) {
    throw new Error('useBrand must be used within BrandProvider')
  }
  return ctx
}

export type NavigationLayout = 'sidebar' | 'mega-menu'

export function useNavigationLayout(): NavigationLayout {
  const { settings } = useBrand()
  return settings.navigationLayout === 'mega-menu' ? 'mega-menu' : 'sidebar'
}
