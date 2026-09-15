import { Link } from 'react-router-dom'
import { BarChart3, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatQuantity } from '@/lib/format-quantity'
import { cn } from '@/lib/utils'

function formatMetricValue(value: string | number): string {
  if (typeof value === 'string') return value
  return formatQuantity(value)
}

/** Solid tinted surfaces (no gradients) with visible borders. */
const variants = {
  blue: {
    card: 'border-[#b7d4c4] bg-[#e7f3eb] dark:border-emerald-900 dark:bg-emerald-950/40',
    text: 'text-[#1c5c3a] dark:text-emerald-300',
    iconBg: 'bg-white/70 dark:bg-emerald-400/10',
  },
  green: {
    card: 'border-[#b7d4c4] bg-[#e7f3eb] dark:border-emerald-900 dark:bg-emerald-950/40',
    text: 'text-[#1b703a] dark:text-emerald-300',
    iconBg: 'bg-white/70 dark:bg-emerald-400/10',
  },
  red: {
    card: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-300',
    iconBg: 'bg-white/70 dark:bg-rose-400/10',
  },
  orange: {
    card: 'border-[#f0c98a] bg-[#fff3e0] dark:border-orange-900 dark:bg-orange-950/40',
    text: 'text-[#b86a00] dark:text-orange-300',
    iconBg: 'bg-white/70 dark:bg-orange-400/10',
  },
  teal: {
    card: 'border-[#b7d4c4] bg-[#eef7f1] dark:border-teal-900 dark:bg-teal-950/40',
    text: 'text-[#145c2f] dark:text-teal-300',
    iconBg: 'bg-white/70 dark:bg-teal-400/10',
  },
  purple: {
    card: 'border-[#d9cce8] bg-[#f3eef8] dark:border-purple-900 dark:bg-purple-950/40',
    text: 'text-[#5b3d7a] dark:text-purple-300',
    iconBg: 'bg-white/70 dark:bg-purple-400/10',
  },
  slate: {
    card: 'border-border bg-white dark:bg-card',
    text: 'text-foreground',
    iconBg: 'bg-[hsl(var(--section-deep))] dark:bg-accent',
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
    <Card
      className={cn(
        'relative overflow-hidden border shadow-none',
        styles.card,
        href && 'cursor-pointer transition-colors hover:brightness-[0.99]',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className={cn('text-base font-semibold leading-snug', styles.text)}>
          {title}
        </CardTitle>
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
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
