import { api, type ApiSuccess } from '@/lib/api'

export async function clearSettingsCache() {
  const { data } = await api.post<ApiSuccess<{ message: string; cache_size_mb: string }>>(
    '/settings/cache/clear',
  )
  return data.data
}

export async function optimizeSettingsSite() {
  const { data } = await api.post<ApiSuccess<{ message: string; cache_size_mb: string }>>(
    '/settings/optimize',
  )
  return data.data
}

export async function sendSettingsTestEmail(email: string) {
  const { data } = await api.post<ApiSuccess<{ message: string }>>('/settings/email/test', {
    email,
  })
  return data.data
}

export async function downloadCookieConsentData(): Promise<void> {
  const { data } = await api.get<Blob>('/settings/cookie/download', { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'cookie_data.csv'
  link.click()
  URL.revokeObjectURL(url)
}
