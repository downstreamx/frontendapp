import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { SystemSetupItem } from '@/lib/system-setup-registry'

type Props = {
  items: SystemSetupItem[]
}

export function SystemSetupSidebar({ items }: Props) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return null
  }

  return (
    <div className="sticky top-4 md:w-64 shrink-0">
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="pr-4 space-y-1">
          {items.map((item) => (
            <NavLink key={item.key} to={item.path} end>
              {({ isActive }) => (
                <Button
                  type="button"
                  variant="ghost"
                  className={cn('w-full justify-start', isActive && 'bg-muted font-medium')}
                >
                  <item.icon className="h-4 w-4 mr-2 shrink-0" />
                  {t(item.label)}
                </Button>
              )}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
