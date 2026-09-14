import { useEffect } from 'react'
import { useBrand } from '@/contexts/brand-context'
import { useAppContext } from '@/contexts/app-context'
import { DEFAULT_BRAND_FAVICON_URL } from '@/lib/brand-assets'
import { getImagePath } from '@/utils/helpers'

/**
 * Applies tenant/platform favicon when set; otherwise the DownstreamX default.
 * Company portals override only when the tenant has uploaded a favicon.
 */
export function useFavicon() {
  const { settings } = useBrand()
  const { imageUrlPrefix } = useAppContext()

  useEffect(() => {
    const uploaded = (settings.favicon || '').trim()
    const faviconUrl = uploaded
      ? getImagePath(uploaded, imageUrlPrefix)
      : DEFAULT_BRAND_FAVICON_URL

    const existingLinks = document.querySelectorAll("link[rel*='icon']")
    existingLinks.forEach((link) => link.remove())

    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = faviconUrl
    document.head.appendChild(link)
  }, [settings.favicon, imageUrlPrefix])
}
