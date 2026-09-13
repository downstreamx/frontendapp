import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type NewsletterSubscriberRow = {
  id: number
  email: string
  subscribed_at: string
  ip_address?: string | null
  country?: string | null
  city?: string | null
  region?: string | null
  country_code?: string | null
  isp?: string | null
  org?: string | null
  timezone?: string | null
  browser?: string | null
  os?: string | null
  device?: string | null
}

export async function listNewsletterSubscribers(
  params: Record<string, string>,
): Promise<PaginatedListResult<NewsletterSubscriberRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/landing-page/newsletter-subscribers', {
    params,
  })
  return extractPaginatedList<NewsletterSubscriberRow>(data)
}

export async function deleteNewsletterSubscriber(id: number) {
  await api.delete(`/landing-page/newsletter-subscribers/${id}`)
}

export async function exportNewsletterSubscribers(
  params: Record<string, string> = {},
): Promise<void> {
  const { data } = await api.get<Blob>('/landing-page/newsletter-subscribers/export', {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
