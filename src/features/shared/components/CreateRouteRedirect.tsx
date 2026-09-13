import { Navigate } from 'react-router-dom'

/** Redirect legacy create routes to list pages with ?create=1 to open the create modal. */
export function CreateRouteRedirect({ listPath }: { listPath: string }) {
  return <Navigate to={`${listPath}?create=1`} replace />
}
