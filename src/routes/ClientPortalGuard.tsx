import { Navigate, Outlet } from 'react-router-dom'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { useMeQuery } from '@/features/auth/hooks'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'

export function ClientPortalGuard() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <PageContentLoader className="min-h-[12rem]" />
  }

  if (me && me.user.type !== 'customer') {
    return <Navigate to={resolveDefaultLandingPath(me)} replace />
  }

  return <Outlet />
}
