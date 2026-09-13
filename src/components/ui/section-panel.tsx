import * as React from 'react'

import { cn } from '@/lib/utils'

const SectionPanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/40 bg-section p-4 text-section-foreground md:p-6',
        className,
      )}
      {...props}
    />
  ),
)
SectionPanel.displayName = 'SectionPanel'

export { SectionPanel }
