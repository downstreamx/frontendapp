import { api, type ApiSuccess } from '@/lib/api'

export type IntegrationStatus = {
  provider: string
  status: string
  configured: boolean
}

export type IntegrationSettings = {
  provider: string
  settings: Record<string, string | null | undefined>
}

export type IntegrationProviderSummary = {
  provider: string
  status: string
  configured: boolean
}

export async function listIntegrations() {
  const { data } = await api.get<ApiSuccess<{ providers: IntegrationProviderSummary[] }>>('/integrations')
  return data.data.providers
}

export async function getIntegrationStatus(provider: string) {
  const { data } = await api.get<ApiSuccess<IntegrationStatus>>(`/integrations/${provider}/status`)
  return data.data
}

export async function getIntegrationSettings(provider: string) {
  const { data } = await api.get<ApiSuccess<IntegrationSettings>>(`/integrations/${provider}/settings`)
  return data.data
}

export async function updateIntegrationSettings(provider: string, settings: Record<string, string>) {
  const { data } = await api.put<ApiSuccess<IntegrationSettings>>(`/integrations/${provider}/settings`, {
    settings,
  })
  return data.data
}
