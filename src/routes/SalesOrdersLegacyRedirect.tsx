import { Navigate, useLocation } from 'react-router-dom'

/** Redirect legacy /sales/proposals URLs to /sales/orders. */
export function SalesOrdersLegacyRedirect() {
  const location = useLocation()
  const target = location.pathname.replace(/^\/sales\/proposals/, '/sales/orders')
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}
