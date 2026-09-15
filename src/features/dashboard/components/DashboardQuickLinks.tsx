import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type DashboardQuickLink = {
  label: string
  href: string
}

/** Solid tinted tiles (no gradients) with visible borders — matches metric cards. */
const linkVariants = [
  {
    tile: 'border-[#b7d4c4] bg-[#e7f3eb] dark:border-emerald-900 dark:bg-emerald-950/40',
    text: 'text-[#1c5c3a] dark:text-emerald-200',
    icon: 'bg-white/70 text-[#1c5c3a] dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  {
    tile: 'border-[#b7d4c4] bg-[#eef7f1] dark:border-emerald-900 dark:bg-emerald-950/40',
    text: 'text-[#1b703a] dark:text-emerald-200',
    icon: 'bg-white/70 text-[#1b703a] dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  {
    tile: 'border-[#d9cce8] bg-[#f3eef8] dark:border-violet-900 dark:bg-violet-950/40',
    text: 'text-[#5b3d7a] dark:text-violet-200',
    icon: 'bg-white/70 text-[#5b3d7a] dark:bg-violet-400/15 dark:text-violet-300',
  },
  {
    tile: 'border-[#f0c98a] bg-[#fff3e0] dark:border-orange-900 dark:bg-orange-950/40',
    text: 'text-[#b86a00] dark:text-orange-200',
    icon: 'bg-white/70 text-[#b86a00] dark:bg-orange-400/15 dark:text-orange-300',
  },
  {
    tile: 'border-[#b7d4c4] bg-[#e7f3eb] dark:border-teal-900 dark:bg-teal-950/40',
    text: 'text-[#145c2f] dark:text-teal-200',
    icon: 'bg-white/70 text-[#145c2f] dark:bg-teal-400/15 dark:text-teal-300',
  },
  {
    tile: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-200',
    icon: 'bg-white/70 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
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
    <Card className="overflow-hidden border shadow-none">
      <CardHeader className="border-b border-border/60 bg-[hsl(var(--section-deep))]/80 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-green-soft)] text-primary dark:bg-accent">
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
                    'group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 shadow-none transition-colors',
                    'hover:brightness-[0.98]',
                    variant.tile,
                  )}
                >
                  <span className={cn('text-sm font-semibold leading-snug', variant.text)}>
                    {link.label}
                  </span>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
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
