import { Navigate, Outlet } from 'react-router-dom'
import { useMeQuery } from '@/features/auth/hooks'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'

export function ClientPortalGuard() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (me && me.user.type !== 'customer') {
    return <Navigate to={resolveDefaultLandingPath(me)} replace />
  }

  return <Outlet />
}
