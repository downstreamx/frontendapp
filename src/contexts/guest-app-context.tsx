import { useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppContext, type AppContextValue } from '@/contexts/app-context'
import { fetchPlatformBrand } from '@/features/auth/api'
import { getApiStoragePrefix } from '@/features/media/media-url'
import { defaultBrandSettings, isDemoEnvironment } from '@/lib/brand-defaults'
import { setPagePropsBridge } from '@/lib/page-props-bridge'

const guestContextValue: AppContextValue = {
  auth: {
    user: null,
    permissions: [],
    roles: [],
    activatedPackages: [],
    impersonating: false,
    lang: 'en',
  },
  companyAllSetting: defaultBrandSettings,
  adminAllSetting: defaultBrandSettings,
  settings: defaultBrandSettings,
  imageUrlPrefix: getApiStoragePrefix(),
  is_demo: isDemoEnvironment(),
}

export function GuestAppContextProvider({ children }: { children: ReactNode }) {
  const { data: platformBrand } = useQuery({
    queryKey: ['platform-brand'],
    queryFn: fetchPlatformBrand,
    staleTime: 5 * 60 * 1000,
  })

  const value = useMemo<AppContextValue>(() => {
    const adminSettings = {
      ...defaultBrandSettings,
      ...(platformBrand?.admin_settings ?? {}),
    }

    return {
      ...guestContextValue,
      companyAllSetting: adminSettings,
      adminAllSetting: adminSettings,
      settings: adminSettings,
      imageUrlPrefix: platformBrand?.image_url_prefix ?? getApiStoragePrefix(),
      is_demo: platformBrand?.is_demo ?? isDemoEnvironment(),
    }
  }, [platformBrand])

  useEffect(() => {
    setPagePropsBridge(value)
    return () => setPagePropsBridge(null)
  }, [value])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
