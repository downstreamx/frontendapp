import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useMeQuery } from '@/features/auth/hooks'
import type { MePayload } from '@/features/auth/api'
import { setPagePropsBridge } from '@/lib/page-props-bridge'

export type AppSettings = Record<string, string>

export type AppContextValue = {
  auth: {
    user: MePayload['user'] | null
    permissions: string[]
    roles: string[]
    activatedPackages: string[]
    impersonating: boolean
    lang: string
  }
  companyAllSetting: AppSettings
  adminAllSetting: AppSettings
  /** Alias for print/report layouts (company brand settings). */
  settings: AppSettings
  imageUrlPrefix: string
  is_demo: boolean
}

import { defaultBrandSettings } from '@/lib/brand-defaults'
import { getApiStoragePrefix } from '@/features/media/media-url'

const defaultSettings: AppSettings = defaultBrandSettings

export const AppContext = createContext<AppContextValue | null>(null)

export function AppContextProvider({ children }: { children: ReactNode }) {
  const { data: me } = useMeQuery()

  const value = useMemo<AppContextValue>(
    () => ({
      auth: {
        user: me?.user ?? null,
        permissions: me?.permissions ?? [],
        roles: me?.roles ?? [],
        activatedPackages: me?.activated_modules ?? [],
        impersonating: me?.impersonating ?? false,
        lang: me?.user?.lang ?? 'en',
      },
      companyAllSetting: { ...defaultSettings, ...(me?.company_settings ?? {}) },
      adminAllSetting: { ...defaultSettings, ...(me?.admin_settings ?? {}) },
      settings: { ...defaultSettings, ...(me?.company_settings ?? {}) },
      imageUrlPrefix: me?.image_url_prefix ?? getApiStoragePrefix(),
      is_demo: me?.is_demo ?? false,
    }),
    [me],
  )

  useEffect(() => {
    setPagePropsBridge(value)
    return () => setPagePropsBridge(null)
  }, [value])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider')
  }
  return ctx
}

/** Drop-in replacement for Inertia usePage().props in ported components */
export function usePageProps(): AppContextValue {
  return useAppContext()
}
