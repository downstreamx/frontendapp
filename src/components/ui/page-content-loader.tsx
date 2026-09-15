import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type PageContentLoaderProps = {
  label?: string
  className?: string
}

/** Centered spinner for the authenticated main content area. */
export function PageContentLoader({ label, className }: PageContentLoaderProps) {
  const { t } = useTranslation()
  const text = label ?? t('Loading…')

  return (
    <div
      className={cn(
        'flex min-h-[min(28rem,60vh)] w-full flex-col items-center justify-center gap-3',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  )
}
