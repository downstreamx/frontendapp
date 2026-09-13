import { useTranslation } from 'react-i18next'
import {
  Activity,
  CheckSquare,
  Database,
  File,
  Package,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type LeadSection =
  | 'general'
  | 'tasks'
  | 'users'
  | 'products'
  | 'sources'
  | 'files'
  | 'calls'
  | 'activity'

type Props = {
  active: LeadSection
  onChange: (section: LeadSection) => void
}

const items: { key: LeadSection; icon: typeof User }[] = [
  { key: 'general', icon: User },
  { key: 'tasks', icon: CheckSquare },
  { key: 'users', icon: Users },
  { key: 'products', icon: Package },
  { key: 'sources', icon: Database },
  { key: 'files', icon: File },
  { key: 'calls', icon: Phone },
  { key: 'activity', icon: Activity },
]

export function LeadSidebar({ active, onChange }: Props) {
  const { t } = useTranslation()

  const labels: Record<LeadSection, string> = {
    general: t('General'),
    tasks: t('Tasks'),
    users: t('Users'),
    products: t('Products'),
    sources: t('Sources'),
    files: t('Files'),
    calls: t('Calls'),
    activity: t('Activity'),
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="pr-4 space-y-1">
        {items.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            className={cn('w-full justify-start', active === key && 'bg-muted font-medium')}
            onClick={() => onChange(key)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {labels[key]}
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
