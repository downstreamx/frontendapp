import type { AppContextValue } from '@/contexts/app-context'

let bridge: AppContextValue | null = null

export function setPagePropsBridge(value: AppContextValue | null): void {
  bridge = value
}

export function getPagePropsBridge(): AppContextValue | null {
  return bridge
}

/** Company settings for the active tenant; superadmin uses admin settings bag. */
export function getActiveSettings(
  pageProps?: Partial<AppContextValue> | null,
): Record<string, string> {
  const props = pageProps ?? getPagePropsBridge()
  if (!props) return {}

  const isSuperAdmin =
    props.auth?.roles?.includes('superadmin') || props.auth?.user?.type === 'superadmin'

  if (isSuperAdmin && props.adminAllSetting) {
    return props.adminAllSetting
  }

  return props.companyAllSetting ?? {}
}
