import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { ReportsCardGrid } from '../components/ReportsCardGrid'
import { listAllReportCatalog } from '../reports-api'
import {
  REPORT_DEFINITIONS,
  mergeReportStatus,
  type ReportDefinition,
} from '../reports-registry'

export type ReportsLandingVariant = 'unified' | 'account' | 'double-entry'

type Props = {
  variant?: ReportsLandingVariant
  /** When set, only show reports in these categories. */
  categories?: Array<ReportDefinition['category']>
}

function filterByVariant(
  reports: ReportDefinition[],
  variant: ReportsLandingVariant,
): ReportDefinition[] {
  if (variant === 'account') {
    return reports.filter((r) => r.category === 'account')
  }
  if (variant === 'double-entry') {
    return reports.filter((r) => r.category === 'financial' || r.category === 'other')
  }
  return reports
}

export function ReportsAnalyticsLandingPage({
  variant = 'unified',
  categories,
}: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const pageTitle =
    variant === 'account'
      ? t('Accounting reports')
      : variant === 'double-entry'
        ? t('Double entry reports')
        : t('Reports and Analytics')

  usePageChrome({
    pageTitle,
    breadcrumbs:
      variant === 'account'
        ? [
            { label: t('Account'), url: paths.account.index },
            { label: t('Reports') },
          ]
        : variant === 'double-entry'
          ? [
              { label: t('Double entry'), url: paths.doubleEntry.reports },
              { label: t('Reports') },
            ]
          : [{ label: t('Reports and Analytics') }],
  })

  const catalogQuery = useQuery({
    queryKey: ['reports', 'catalog'],
    queryFn: listAllReportCatalog,
  })

  const visibleReports = useMemo(() => {
    const merged = mergeReportStatus(REPORT_DEFINITIONS, catalogQuery.data ?? [])
    const permitted = merged.filter((report) =>
      hasPermission(auth.permissions, auth.roles, auth.user?.type, report.permission),
    )
    const byVariant = filterByVariant(permitted, variant)
    if (!categories?.length) return byVariant
    return byVariant.filter((r) => categories.includes(r.category))
  }, [auth.permissions, auth.roles, auth.user?.type, catalogQuery.data, variant, categories])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>
          {t('Open a report to view balances, aging, and financial statements.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {catalogQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        )}
        {catalogQuery.error && (
          <p className="text-sm text-destructive">{t('Failed to load reports.')}</p>
        )}
        {!catalogQuery.isLoading && !catalogQuery.error ? (
          <ReportsCardGrid reports={visibleReports} />
        ) : null}
      </CardContent>
    </Card>
  )
}
