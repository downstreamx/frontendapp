import { Navigate } from 'react-router-dom'
import { useMeQuery } from '@/features/auth/hooks'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { paths } from '@/lib/paths'

export function DefaultLandingRedirect() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>
  }

  if (!me) {
    return <Navigate to={paths.login} replace />
  }

  return <Navigate to={resolveDefaultLandingPath(me)} replace />
}
