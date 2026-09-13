import { useEffect } from 'react'
import { useBrand } from '@/contexts/brand-context'
import { useAppContext } from '@/contexts/app-context'
import { getImagePath } from '@/utils/helpers'

export function useFavicon() {
  const { settings } = useBrand()
  const { imageUrlPrefix } = useAppContext()

  useEffect(() => {
    const favicon = settings.favicon
    if (!favicon) return

    const faviconUrl = getImagePath(favicon, imageUrlPrefix)

    const existingLinks = document.querySelectorAll('link[rel*="icon"]')
    existingLinks.forEach((link) => link.remove())

    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = faviconUrl
    document.head.appendChild(link)
  }, [settings.favicon, imageUrlPrefix])
}
