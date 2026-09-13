import type { MePayload } from '@/features/auth/api'
import { paths } from '@/lib/paths'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'

export function resolvePostAuthPath(me: MePayload): string {
  if (me.user.type === 'company' && me.company?.needs_provisioning) {
    return paths.accountBeingPrepared
  }

  return resolveDefaultLandingPath(me)
}
