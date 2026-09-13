import { ReportsAnalyticsLandingPage } from '@/features/reports/pages/ReportsAnalyticsLandingPage'

export function DoubleEntryReportsPage() {
  return (
    <ReportsAnalyticsLandingPage
      variant="double-entry"
      categories={['financial', 'other']}
    />
  )
}
