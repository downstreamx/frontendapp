import { CreateRouteRedirect } from '@/features/shared/components/CreateRouteRedirect'
import { paths } from '@/lib/paths'

/** Legacy create route — opens the create modal on the projects list. */
export function ProjectCreateRedirect() {
  return <CreateRouteRedirect listPath={paths.taskly.projects} />
}
