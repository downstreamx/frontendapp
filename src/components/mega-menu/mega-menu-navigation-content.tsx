import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cn } from '@/lib/utils'

/** Mega menu dropdown surface — no Radix slide/fade motion. */
export const MegaMenuNavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn('absolute left-0 top-full z-50 w-max', className)}
    {...props}
  />
))
MegaMenuNavigationMenuContent.displayName = 'MegaMenuNavigationMenuContent'
