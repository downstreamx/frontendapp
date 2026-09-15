import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { NavItem } from '@/types'
import { isMenuBranchActive, isMenuPathActive } from '@/utils/menu-path'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MenuLucideIcon } from './mega-menu-icon'

type MegaMenuMobileDrawerProps = {
  items: NavItem[]
  onNavigate?: () => void
}

function MegaMenuMobileNavTree({
  items,
  depth = 0,
  onNavigate,
}: {
  items: NavItem[]
  depth?: number
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()

  return (
    <ul className={cn('space-y-1', depth > 0 && 'ms-3 border-s border-border/50 ps-3')}>
      {items.map((item) => {
        const isActive = isMenuPathActive(pathname, item.href, { matchExact: item.matchExact })
        const hasActiveChild = item.children ? isMenuBranchActive(pathname, item.children) : false
        const shouldBeActive = isActive || hasActiveChild

        if (item.children && item.children.length > 0) {
          return (
            <li key={item.title}>
              <Collapsible defaultOpen={shouldBeActive} className="group/collapsible">
                <CollapsibleTrigger
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-[hsl(var(--section-deep))]',
                    shouldBeActive && 'bg-[var(--brand-green-soft)] font-medium text-accent-foreground dark:bg-accent',
                  )}
                >
                  <MenuLucideIcon item={item} />
                  <span className="flex-1 text-start">{item.title}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <MegaMenuMobileNavTree items={item.children} depth={depth + 1} onNavigate={onNavigate} />
                </CollapsibleContent>
              </Collapsible>
            </li>
          )
        }

        return (
          <li key={item.title}>
            {item.href ? (
              <Link
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-[hsl(var(--section-deep))]',
                  isActive && 'bg-primary font-medium text-primary-foreground hover:bg-primary/90',
                )}
              >
                <MenuLucideIcon item={item} />
                {item.title}
              </Link>
            ) : (
              <span className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
                <MenuLucideIcon item={item} />
                {item.title}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function MegaMenuMobileDrawer({ items, onNavigate }: MegaMenuMobileDrawerProps) {
  return (
    <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-2">
      <MegaMenuMobileNavTree items={items} onNavigate={onNavigate} />
    </ScrollArea>
  )
}
