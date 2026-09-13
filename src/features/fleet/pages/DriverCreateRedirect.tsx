import { CreateRouteRedirect } from '@/features/shared/components/CreateRouteRedirect'
import { paths } from '@/lib/paths'

/** Legacy create route — opens the create modal on the drivers list. */
export function DriverCreateRedirect() {
  return <CreateRouteRedirect listPath={paths.fleet.drivers} />
}
