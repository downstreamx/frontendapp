import { Navigate } from 'react-router-dom'
import { useAppContext } from '@/contexts/app-context'
import {
  canAccessSystemSetupItem,
  getSystemSetupModule,
} from '@/lib/system-setup-registry'

type Props = {
  moduleKey: string
}

export function SystemSetupHubRedirect({ moduleKey }: Props) {
  const { auth } = useAppContext()
  const module = getSystemSetupModule(moduleKey)

  if (!module) {
    return null
  }

  const target =
    module.items.find((item) =>
      canAccessSystemSetupItem(auth.permissions, auth.roles, auth.user?.type, item),
    )?.path ?? module.defaultPath

  return <Navigate to={target} replace />
}
