import { Navigate } from 'react-router-dom'
import { paths } from '@/lib/paths'

/** Create/edit/show deep-links open the vendors list; view/create/edit use modals there. */
export function VendorFormPage() {
  return <Navigate to={paths.vendorManagement.vendors} replace />
}

export function VendorShowPage() {
  return <Navigate to={paths.vendorManagement.vendors} replace />
}
