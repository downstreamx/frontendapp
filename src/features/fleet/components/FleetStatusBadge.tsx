import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const variantMap: Record<string, string> = {
  active: 'bg-[var(--brand-green-soft)] text-accent-foreground',
  scheduled: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  planned: 'bg-[var(--brand-orange-soft)] text-[color:var(--brand-orange)]',
  in_progress: 'bg-accent text-accent-foreground',
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
    <Badge variant="outline" className={cn('border-0 font-medium', variantMap[key])}>
      {label ?? formatStatus(key)}
    </Badge>
  )
}
