import { Navigate, useParams } from 'react-router-dom'
import { paths } from '@/lib/paths'

/** Legacy show route — opens the employee details modal on the list page. */
export function EmployeeViewRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${paths.hrm.employees}?view=${id}`} replace />
}
