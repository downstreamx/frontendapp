import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  Ongoing: 'border-blue-200 bg-blue-50 text-blue-800',
  Onhold: 'border-amber-200 bg-amber-50 text-amber-800',
  Finished: 'border-green-200 bg-green-50 text-green-800',
}

type Props = {
  status: string
  className?: string
}

export function ProjectStatusBadge({ status, className }: Props) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_STYLES[status], className)}>
      {t(status)}
    </Badge>
  )
}
