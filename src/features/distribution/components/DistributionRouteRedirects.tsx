import { Navigate, useLocation, useParams } from 'react-router-dom'

export function DistributionCreateRedirect({ listPath }: { listPath: string }) {
  const location = useLocation()
  return <Navigate to={`${listPath}${location.search}`} replace />
}

export function DistributionEditRedirect({ listPath }: { listPath: string }) {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${listPath}?edit=${id ?? ''}`} replace />
}
