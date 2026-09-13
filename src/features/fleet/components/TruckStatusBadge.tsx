import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusClasses: Record<string, string> = {
  available: 'border-green-200 bg-green-50 text-green-800',
  'in-transit': 'border-blue-200 bg-blue-50 text-blue-800',
  loading: 'border-blue-200 bg-blue-50 text-blue-800',
  unloading: 'border-blue-200 bg-blue-50 text-blue-800',
  'under-maintenance': 'border-amber-200 bg-amber-50 text-amber-800',
  disabled: 'border-red-200 bg-red-50 text-red-800',
  'out-of-compliance': 'border-red-200 bg-red-50 text-red-800',
  reserved: 'border-red-200 bg-red-50 text-red-800',
  staging: 'border-red-200 bg-red-50 text-red-800',
  retired: 'border-slate-200 bg-slate-50 text-slate-700',
  other: 'border-slate-200 bg-slate-50 text-slate-700',
}

function formatStatusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function TruckStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation()
  if (!status) return <span className="text-muted-foreground">—</span>

  const label = formatStatusLabel(status)

  return (
    <Badge variant="outline" className={cn('font-normal', statusClasses[status] ?? '')}>
      {t(label)}
    </Badge>
  )
}
