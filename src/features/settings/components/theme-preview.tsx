import { getImagePath } from '@/utils/helpers'
import { useTranslation } from 'react-i18next'

type ThemePreviewProps = {
  logoDark?: string
  logoLight?: string
  themeColor?: string
  customColor?: string
  sidebarVariant?: string
  sidebarStyle?: string
  navigationLayout?: string
  layoutDirection?: string
  themeMode?: string
  imageUrlPrefix?: string
}

export function ThemePreview({
  logoDark,
  logoLight,
  themeColor = 'green',
  customColor = '#1b703a',
  sidebarVariant = 'inset',
  sidebarStyle = 'colored',
  navigationLayout = 'mega-menu',
  layoutDirection = 'ltr',
  themeMode = 'light',
}: ThemePreviewProps) {
  const { t } = useTranslation()

  const themeColors = {
    blue: '#3b82f6',
    green: '#1b703a',
    purple: '#8b5cf6',
    orange: '#f08c00',
    red: '#ef4444',
  }

  const primaryColor =
    themeColor === 'custom'
      ? customColor
      : themeColors[themeColor as keyof typeof themeColors] || '#1b703a'

  const isDark = themeMode === 'dark'
  const isRTL = layoutDirection === 'rtl'
  const currentLogo = isDark ? logoLight : logoDark
  const isMegaMenu = navigationLayout === 'mega-menu'

  const getSidebarStyles = () => {
    let baseClasses = 'w-16 border-r flex flex-col py-3 px-2 gap-2'
    if (sidebarStyle === 'colored' || sidebarStyle === 'gradient') {
      baseClasses += ' text-white'
    }
    return baseClasses
  }

  const getSidebarBackground = (): React.CSSProperties => {
    if (sidebarStyle === 'colored') {
      return { backgroundColor: primaryColor }
    }
    if (sidebarStyle === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`,
      }
    }
    return {}
  }

  if (isMegaMenu) {
    return (
      <div
        className={`border rounded-lg overflow-hidden text-xs transition-all duration-300 ${
          isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-background text-foreground'
        } ${isRTL ? 'rtl' : 'ltr'}`}
      >
        <div
          className={`flex items-stretch border-b ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-background'
          } ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <div
            className={`flex flex-col gap-1 p-2 border-r shrink-0 ${
              isDark ? 'border-gray-700' : 'border-border'
            }`}
          >
            {currentLogo ? (
              <img src={getImagePath(currentLogo)} alt="Logo" className="h-4 w-auto object-contain" />
            ) : (
              <div className="h-2 w-12 rounded" style={{ backgroundColor: primaryColor }} />
            )}
            <div className="flex items-center gap-1 mt-1">
              <div className={`h-4 w-4 rounded-full ${isDark ? 'bg-gray-600' : 'bg-muted'}`} />
              <div className={`h-1.5 w-8 rounded ${isDark ? 'bg-gray-600' : 'bg-muted'}`} />
            </div>
          </div>
          <div className={`flex flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {[true, false, false, false, false].map((active, i) => (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 border-r last:border-r-0 ${
                  isDark ? 'border-gray-700' : 'border-border/60'
                } ${active ? 'text-white' : ''}`}
                style={active ? { backgroundColor: primaryColor } : undefined}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-sm ${
                    active ? 'bg-white/80' : isDark ? 'bg-gray-600' : 'bg-muted-foreground/30'
                  }`}
                />
                <div
                  className={`h-1 w-6 rounded ${
                    active ? 'bg-white/60' : isDark ? 'bg-gray-700' : 'bg-muted'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={`h-24 p-3 space-y-2 ${isDark ? 'bg-gray-900' : 'bg-muted/20'}`}>
          <div className={`h-2 rounded w-3/4 ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
          <div className={`h-2 rounded w-1/2 ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border rounded-lg overflow-hidden text-xs transition-all duration-300 ${
        isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-background text-foreground'
      } ${isRTL ? 'rtl' : 'ltr'}`}
    >
      <div
        className={`px-3 py-2 border-b flex items-center justify-between ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-muted'
        }`}
      >
        <span className="font-medium">{t('Dashboard')}</span>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded ${isDark ? 'bg-gray-600' : 'bg-muted-foreground/20'}`} />
          <div className={`w-4 h-4 rounded ${isDark ? 'bg-gray-600' : 'bg-muted-foreground/20'}`} />
        </div>
      </div>

      <div className={`flex h-48 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div
          className={`order-1 rtl:order-2 ${getSidebarStyles()} ${
            sidebarVariant === 'floating' ? 'm-2 rounded-lg shadow-sm' : ''
          } ${sidebarVariant === 'minimal' ? 'w-12' : 'w-16'} ${
            isDark && sidebarStyle === 'plain'
              ? 'bg-gray-800 border-gray-700'
              : !isDark && sidebarStyle === 'plain'
                ? 'bg-muted/50'
                : ''
          }`}
          style={getSidebarBackground()}
        >
          <div className="flex justify-center mb-2">
            {currentLogo ? (
              <img
                src={getImagePath(currentLogo)}
                alt="Logo"
                className="w-8 h-4 object-contain"
              />
            ) : (
              <div className="w-8 h-2 rounded" style={{ backgroundColor: primaryColor }} />
            )}
          </div>
          <div className="space-y-2">
            <div
              className="w-full h-2 rounded"
              style={{
                backgroundColor:
                  sidebarStyle === 'plain' ? primaryColor : 'rgba(255,255,255,0.8)',
              }}
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-full h-2 rounded ${
                  sidebarStyle === 'plain'
                    ? isDark
                      ? 'bg-gray-600'
                      : 'bg-muted-foreground/30'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 p-3 space-y-2 order-2 rtl:order-1">
          <div className={`h-2 rounded w-3/4 ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
          <div className={`h-2 rounded w-1/2 ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
          <div className={`h-2 rounded w-2/3 ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
          <div className="flex gap-2 mt-3">
            <div
              className="w-6 h-4 rounded"
              style={{ backgroundColor: `${primaryColor}33` }}
            />
            <div className={`w-6 h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
            <div className={`w-6 h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-muted'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
