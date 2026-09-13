import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type DashboardQuickLink = {
  label: string
  href: string
}

const linkVariants = [
  {
    tile: 'border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-blue-100/60 hover:from-blue-100 hover:to-blue-50 dark:border-blue-900/60 dark:from-blue-950/50 dark:via-background dark:to-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
  },
  {
    tile: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-50 dark:border-emerald-900/60 dark:from-emerald-950/50 dark:via-background dark:to-emerald-900/20',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  {
    tile: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-violet-100/60 hover:from-violet-100 hover:to-violet-50 dark:border-violet-900/60 dark:from-violet-950/50 dark:via-background dark:to-violet-900/20',
    text: 'text-violet-800 dark:text-violet-200',
    icon: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  },
  {
    tile: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/60 hover:from-orange-100 hover:to-orange-50 dark:border-orange-900/60 dark:from-orange-950/50 dark:via-background dark:to-orange-900/20',
    text: 'text-orange-800 dark:text-orange-200',
    icon: 'bg-orange-600/10 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300',
  },
  {
    tile: 'border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-teal-100/60 hover:from-teal-100 hover:to-teal-50 dark:border-teal-900/60 dark:from-teal-950/50 dark:via-background dark:to-teal-900/20',
    text: 'text-teal-800 dark:text-teal-200',
    icon: 'bg-teal-600/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300',
  },
  {
    tile: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-rose-100/60 hover:from-rose-100 hover:to-rose-50 dark:border-rose-900/60 dark:from-rose-950/50 dark:via-background dark:to-rose-900/20',
    text: 'text-rose-800 dark:text-rose-200',
    icon: 'bg-rose-600/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',
  },
] as const

export function DashboardQuickLinks({
  title,
  links,
}: {
  title?: string
  links: DashboardQuickLink[]
}) {
  const { t } = useTranslation()

  if (links.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-muted/60 via-background to-muted/40 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" aria-hidden />
          </span>
          {title ?? t('Quick links')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {links.map((link, index) => {
            const variant = linkVariants[index % linkVariants.length]

            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    'group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 shadow-sm transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md',
                    variant.tile,
                  )}
                >
                  <span className={cn('text-sm font-semibold leading-snug', variant.text)}>
                    {link.label}
                  </span>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                      variant.icon,
                    )}
                    aria-hidden
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
