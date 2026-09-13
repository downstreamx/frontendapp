import { Navigate } from 'react-router-dom'
import { paths } from '@/lib/paths'

/** Legacy route — opens create modal on the supplier payments index. */
export function SupplierPaymentCreatePage() {
  return <Navigate to={`${paths.account.supplierPayments.index}?create=1`} replace />
}
