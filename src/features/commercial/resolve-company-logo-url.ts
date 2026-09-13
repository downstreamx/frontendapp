import type { AppSettings } from '@/contexts/app-context'
import { resolveMediaUrl } from '@/features/media/media-url'

export function resolveCompanyLogoUrl(
  companySettings: AppSettings,
  imageUrlPrefix?: string,
): string {
  const logo =
    companySettings.logo_dark ||
    companySettings.logo_light ||
    companySettings.company_logo ||
    ''

  if (!logo || typeof logo !== 'string') {
    return ''
  }

  return resolveMediaUrl(logo, imageUrlPrefix)
}

export function companyMonogram(companyName: string): string {
  const words = companyName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'CO'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}
