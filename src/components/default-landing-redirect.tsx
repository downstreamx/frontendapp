import { Navigate } from 'react-router-dom'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { useMeQuery } from '@/features/auth/hooks'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { paths } from '@/lib/paths'

export function DefaultLandingRedirect() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading) {
    return <PageContentLoader className="min-h-[12rem]" />
  }

  if (!me) {
    return <Navigate to={paths.login} replace />
  }

  return <Navigate to={resolveDefaultLandingPath(me)} replace />
}
