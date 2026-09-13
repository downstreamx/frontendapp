import { Link } from 'react-router-dom'
import { BarChart3, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatQuantity } from '@/lib/format-quantity'
import { cn } from '@/lib/utils'

function formatMetricValue(value: string | number): string {
  if (typeof value === 'string') return value
  return formatQuantity(value)
}

const variants = {
  blue: {
    card: 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-600/10 dark:bg-blue-400/10',
  },
  green: {
    card: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-600/10 dark:bg-emerald-400/10',
  },
  red: {
    card: 'border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/20 dark:border-rose-900',
    text: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-600/10 dark:bg-rose-400/10',
  },
  orange: {
    card: 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/20 dark:border-orange-900',
    text: 'text-orange-700 dark:text-orange-300',
    iconBg: 'bg-orange-600/10 dark:bg-orange-400/10',
  },
  teal: {
    card: 'border-teal-200 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/40 dark:to-teal-900/20 dark:border-teal-900',
    text: 'text-teal-700 dark:text-teal-300',
    iconBg: 'bg-teal-600/10 dark:bg-teal-400/10',
  },
  purple: {
    card: 'border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 dark:border-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-600/10 dark:bg-purple-400/10',
  },
  slate: {
    card: 'border-border bg-muted/30',
    text: 'text-foreground',
    iconBg: 'bg-foreground/8',
  },
} as const

export type DashboardMetricVariant = keyof typeof variants

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  variant = 'slate',
  icon,
  href,
}: {
  title: string
  value: string | number
  subtitle?: string
  variant?: DashboardMetricVariant
  icon?: LucideIcon
  href?: string
}) {
  const styles = variants[variant]
  const Icon = icon ?? BarChart3

  const content = (
    <Card className={cn('relative overflow-hidden transition-shadow hover:shadow-card', styles.card, href && 'cursor-pointer')}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className={cn('text-base font-semibold leading-snug', styles.text)}>{title}</CardTitle>
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg',
            styles.iconBg,
          )}
          aria-hidden
        >
          <Icon className={cn('h-7 w-7', styles.text)} strokeWidth={1.75} absoluteStrokeWidth />
        </span>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', styles.text)}>
          {formatMetricValue(value)}
        </div>
        {subtitle ? <p className={cn('mt-1.5 text-sm opacity-80', styles.text)}>{subtitle}</p> : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
