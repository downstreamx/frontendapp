import type { ImgHTMLAttributes } from 'react'
import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

type ApplicationLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  alt?: string
}

/** Default DownstreamX wordmark — used when no tenant/platform logo is configured. */
export default function ApplicationLogo({ className, alt = 'DownstreamX', ...props }: ApplicationLogoProps) {
  return (
    <img
      src={DEFAULT_BRAND_LOGO_URL}
      alt={alt}
      className={cn('h-auto w-auto max-h-14 object-contain', className)}
      {...props}
    />
  )
}
