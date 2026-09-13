import { Link } from 'react-router-dom'
import { Bug, CheckSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'

type Stats = {
  taskCount: number
  bugCount: number
  daysLeft: number
  budget?: number | string
}

type Props = {
  projectId: number
  stats: Stats
  canManageTasks?: boolean
  canManageBugs?: boolean
}

export function ProjectStatsCards({
  projectId,
  stats,
  canManageTasks,
  canManageBugs,
}: Props) {
  const { t } = useTranslation()

  const items = [
    {
      label: t('Tasks'),
      value: stats.taskCount,
      className: 'border-blue-100 bg-blue-50/50',
      valueClassName: 'text-blue-600',
      icon: CheckSquare,
      href: canManageTasks ? paths.taskly.projectTasksKanban(projectId) : undefined,
    },
    {
      label: t('Bugs'),
      value: stats.bugCount,
      className: 'border-red-100 bg-red-50/50',
      valueClassName: 'text-red-600',
      icon: Bug,
      href: canManageBugs ? paths.taskly.projectBugsKanban(projectId) : undefined,
    },
    {
      label: t('Days left'),
      value: Math.round(stats.daysLeft),
      className: 'border-green-100 bg-green-50/50',
      valueClassName: 'text-green-600',
    },
    {
      label: t('Budget'),
      value: stats.budget != null ? formatCurrency(Number(stats.budget)) : '—',
      className: 'border-amber-100 bg-amber-50/50',
      valueClassName: 'text-amber-600',
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        const content = (
          <Card className={cn('h-full', item.className, item.href && 'transition-shadow hover:shadow-md')}>
            <CardContent className="relative pt-4">
              {Icon ? (
                <Icon className="absolute right-3 top-3 h-4 w-4 opacity-60" />
              ) : null}
              <p className={cn('text-2xl font-bold', item.valueClassName)}>{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        )

        if (item.href) {
          return (
            <Link key={item.label} to={item.href} className="block">
              {content}
            </Link>
          )
        }

        return <div key={item.label}>{content}</div>
      })}
    </section>
  )
}
