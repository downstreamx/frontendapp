import { Navigate } from 'react-router-dom'
import { useMeQuery } from '@/features/auth/hooks'
import { paths } from '@/lib/paths'
import { isSuperAdminUser, resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { SuperAdminDashboardPage } from './SuperAdminDashboardPage'
import { CompanyOverviewDashboardPage } from './CompanyOverviewDashboardPage'

export function DashboardPage() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
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
