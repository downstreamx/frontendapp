import { CreateRouteRedirect } from '@/features/shared/components/CreateRouteRedirect'
import { paths } from '@/lib/paths'

/** Legacy create route — opens the create modal on the employees list. */
export function EmployeeCreateRedirect() {
  return <CreateRouteRedirect listPath={paths.hrm.employees} />
}
