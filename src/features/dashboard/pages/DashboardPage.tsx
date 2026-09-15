import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { useMeQuery } from '@/features/auth/hooks'
import { paths } from '@/lib/paths'
import { isSuperAdminUser, resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { SuperAdminDashboardPage } from './SuperAdminDashboardPage'
import { CompanyOverviewDashboardPage } from './CompanyOverviewDashboardPage'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <PageContentLoader label={t('Loading dashboard…')} />
  }

  if (me && isSuperAdminUser(me)) {
    return <SuperAdminDashboardPage />
  }

  if (me?.user.type === 'company') {
    return <CompanyOverviewDashboardPage />
  }

  if (me) {
    const landing = resolveDefaultLandingPath(me)
    if (landing !== paths.dashboard) {
      return <Navigate to={landing} replace />
    }
  }

  return <Navigate to={me ? resolveDefaultLandingPath(me) : paths.login} replace />
}
