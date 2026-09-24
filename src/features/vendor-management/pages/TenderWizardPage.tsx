import { Navigate, useParams } from 'react-router-dom'
import { paths } from '@/lib/paths'

/** Create/edit tenders open from the index via TenderWizardDialog. */
export function TenderWizardPage() {
  const { id } = useParams()
  if (id) {
    return <Navigate to={paths.vendorManagement.tenderShow(Number(id))} replace />
  }
  return <Navigate to={paths.vendorManagement.tenders} replace />
}
