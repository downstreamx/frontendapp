import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMeQuery } from '@/features/auth/hooks'
import { isSuperAdminExclusivePath } from '@/lib/superadmin-platform-paths'
import { isSuperAdminUser, resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'

type Props = {
  children: ReactNode
}

/**
 * Redirects non–super-admin users away from platform-only SPA paths
 * (coupons, templates, add-ons manager).
 */
export function SuperAdminPlatformGuard({ children }: Props) {
  const { pathname } = useLocation()
  const { data: me, isLoading } = useMeQuery()

  if (!isSuperAdminExclusivePath(pathname)) {
    return <>{children}</>
  }

  if (isLoading) {
    return null
  }

  if (!me || !isSuperAdminUser(me)) {
    return <Navigate to={me ? resolveDefaultLandingPath(me) : '/login'} replace />
  }

  return <>{children}</>
}
