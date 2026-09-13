import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_ORDER,
  type ReportCategory,
  type ReportDefinition,
} from '../reports-registry'

type Props = {
  reports: ReportDefinition[]
  emptyMessage?: string
}

function ReportCard({
  title,
  description,
  href,
  comingSoon,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  comingSoon: boolean
  icon: LucideIcon
}) {
  const { t } = useTranslation()

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {comingSoon ? (
          <Badge variant="secondary">{t('Coming soon')}</Badge>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{t('Open')}</span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-medium leading-snug">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  )

  if (comingSoon) {
    return (
      <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 opacity-70">{inner}</div>
    )
  }

  return (
    <Link
      to={href}
      className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      {inner}
    </Link>
  )
}

export function ReportsCardGrid({ reports, emptyMessage }: Props) {
  const { t } = useTranslation()

  const grouped = REPORT_CATEGORY_ORDER.reduce(
    (acc, category) => {
      const items = reports.filter((r) => r.category === category)
      if (items.length > 0) acc[category] = items
      return acc
    },
    {} as Partial<Record<ReportCategory, ReportDefinition[]>>,
  )

  const categories = REPORT_CATEGORY_ORDER.filter((c) => grouped[c]?.length)

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? t('No reports are available for your role.')}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-4 text-lg font-semibold">{t(REPORT_CATEGORY_LABELS[category])}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grouped[category]!.map((report) => (
              <li key={report.key} className="min-h-[140px]">
                <ReportCard
                  title={t(report.titleKey)}
                  description={t(report.descriptionKey)}
                  href={report.href}
                  comingSoon={report.status === 'coming_soon'}
                  icon={report.icon}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
