import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { SectionPanel } from '@/components/ui/section-panel'

type FormSectionProps = {
  title?: string
  description?: string
  children: ReactNode
  variant?: 'default' | 'highlight'
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  variant = 'default',
  className,
}: FormSectionProps) {
  const content = (
    <>
      {title ? (
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">{title}</h3>
          {description ? <p className="text-base text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </>
  )

  if (variant === 'highlight') {
    return <SectionPanel className={className}>{content}</SectionPanel>
  }

  return <div className={cn('space-y-4', className)}>{content}</div>
}
