import type { AppSettings } from '@/contexts/app-context'

export const defaultBrandSettings: AppSettings = {
  logo_dark: '',
  logo_light: '',
  favicon: '',
  titleText: 'DownstreamX',
  footerText: `© ${new Date().getFullYear()} DownstreamX. All rights reserved.`,
  sidebarVariant: 'inset',
  sidebarStyle: 'plain',
  navigationLayout: 'mega-menu',
  layoutDirection: 'ltr',
  themeMode: 'light',
  themeColor: 'green',
  customColor: '#10b77f',
  enableRegistration: 'on',
}

export function isDemoEnvironment(): boolean {
  return import.meta.env.VITE_APP_DEMO_MODE === 'true'
}
