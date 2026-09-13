import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMeQuery } from '@/features/auth/hooks'
import { clearAuthToken, getAuthToken } from '@/lib/api'
import { paths } from '@/lib/paths'

function AuthSessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
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
