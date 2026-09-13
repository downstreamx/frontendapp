import { Navigate, useLocation, useParams } from 'react-router-dom'

type Props = {
  listPath: string
}

/** Legacy full-page form routes redirect to the list with modal query params. */
export function DistributionFormPage({ listPath }: Props) {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  if (id) {
    return <Navigate to={`${listPath}?edit=${id}`} replace />
  }

  return <Navigate to={`${listPath}${location.search}`} replace />
}
