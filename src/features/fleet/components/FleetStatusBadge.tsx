import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const variantMap: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  completed: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  planned: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function FleetStatusBadge({
  status,
  label,
}: {
  status?: string | null
  label?: string | null
}) {
  if (!status) return <span className="text-muted-foreground">—</span>
  const key = status.toLowerCase()
  return (
    <Badge variant="outline" className={cn('border-0 font-normal', variantMap[key])}>
      {label ?? formatStatus(key)}
    </Badge>
  )
}
