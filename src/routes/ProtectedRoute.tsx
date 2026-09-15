import { Navigate, Outlet } from 'react-router-dom'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { useMeQuery } from '@/features/auth/hooks'
import { clearAuthToken, getAuthToken } from '@/lib/api'
import { paths } from '@/lib/paths'

function AuthSessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <PageContentLoader className="min-h-0" />
    </div>
  )
}

/** Requires a stored token and a successful `/auth/me` before rendering the app shell. */
export function ProtectedRoute() {
  const token = getAuthToken()
  const { isLoading, isError, isFetched, data } = useMeQuery()

  if (!token) {
    return <Navigate to={paths.login} replace />
  }

  if (isLoading || !isFetched) {
    return <AuthSessionLoading />
  }

  if (isError || !data) {
    clearAuthToken()
    return <Navigate to={paths.login} replace />
  }

  return <Outlet />
}
