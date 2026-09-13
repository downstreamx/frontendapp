import { api, type ApiSuccess } from '@/lib/api'

export type MarketplaceModule = {
  module: string
  name: string
  package_name?: string
  monthly_price?: number
  yearly_price?: number
}

export type MarketplaceSetting = {
  id?: number
  module: string
  title?: string
  subtitle?: string
  config_sections?: {
    sections?: Record<string, Record<string, unknown>>
    section_visibility?: Record<string, boolean>
    section_order?: string[]
  }
}

export async function listMarketplaceModules() {
  const { data } = await api.get<ApiSuccess<{ modules: MarketplaceModule[] }>>(
    '/landing-page/marketplace/modules',
  )
  return data.data?.modules ?? []
}

export async function getMarketplaceSettings(module: string) {
  const { data } = await api.get<ApiSuccess<MarketplaceSetting>>('/landing-page/marketplace/settings', {
    params: { module },
  })
  return data.data!
}

export async function saveMarketplaceSettings(payload: MarketplaceSetting) {
  const { data } = await api.put<ApiSuccess<MarketplaceSetting>>('/landing-page/marketplace/settings', payload)
  return data.data!
}
