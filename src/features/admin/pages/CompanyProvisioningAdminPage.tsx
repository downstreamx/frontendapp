import { Navigate, useSearchParams } from 'react-router-dom'
import { paths } from '@/lib/paths'

/** Legacy full-page route → companies list with provisioning modal query. */
export function CompanyProvisioningAdminPage() {
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company_id')

  if (companyId) {
    return (
      <Navigate
        to={`${paths.users.index}?provision_company_id=${encodeURIComponent(companyId)}`}
        replace
      />
    )
  }

  return <Navigate to={paths.users.index} replace />
}
