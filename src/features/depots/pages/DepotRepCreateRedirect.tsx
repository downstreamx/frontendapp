import { CreateRouteRedirect } from '@/features/shared/components/CreateRouteRedirect'
import { paths } from '@/lib/paths'

/** Legacy create route — opens the create modal on the depot reps list. */
export function DepotRepCreateRedirect() {
  return <CreateRouteRedirect listPath={paths.depots.depotReps} />
}
