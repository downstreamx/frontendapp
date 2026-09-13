import { CreateRouteRedirect } from '@/features/shared/components/CreateRouteRedirect'
import { paths } from '@/lib/paths'

/** Legacy create route — opens the create modal on the items list. */
export function ProductCreatePage() {
  return <CreateRouteRedirect listPath={paths.inventory.products} />
}
