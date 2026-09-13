import type { MePayload } from '@/features/auth/api'
import { paths } from '@/lib/paths'

export function isSuperAdminUser(me: Pick<MePayload, 'user' | 'roles'>): boolean {
  return me.user.type === 'superadmin' || me.roles.includes('superadmin')
}

/** Mirrors legacy `HomeController::regularDashboard()` + superadmin branch. */
export function resolveDefaultLandingPath(me: MePayload): string {
  if (isSuperAdminUser(me)) {
    return paths.dashboard
  }

  switch (me.user.type) {
    case 'company':
      return paths.dashboard
    case 'customer':
      return paths.portal.dashboard
    case 'supplier':
      return paths.account.index
    case 'staff':
      return paths.hrm.index
    default:
      return paths.dashboard
  }
}
