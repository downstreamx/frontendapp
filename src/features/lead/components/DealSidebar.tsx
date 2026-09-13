import { useTranslation } from 'react-i18next'
import { CheckSquare, File, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type DealSection = 'general' | 'tasks' | 'calls' | 'files'

type Props = {
  active: DealSection
  onChange: (section: DealSection) => void
}

const items: { key: DealSection; icon: typeof User }[] = [
  { key: 'general', icon: User },
  { key: 'tasks', icon: CheckSquare },
  { key: 'calls', icon: Phone },
  { key: 'files', icon: File },
]

export function DealSidebar({ active, onChange }: Props) {
  const { t } = useTranslation()

  const labels: Record<DealSection, string> = {
    general: t('General'),
    tasks: t('Tasks'),
    calls: t('Calls'),
    files: t('Files'),
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
