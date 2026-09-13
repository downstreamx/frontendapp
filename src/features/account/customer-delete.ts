import { hasPermission } from '@/lib/permissions'
import type { PartyRow } from './account-party-api'

export function canDeleteCustomer(
  customer: Pick<PartyRow, 'user'>,
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-customers')) {
    return false
  }

  if (customer.user?.is_disable) {
    return false
  }

  return true
}

export function customerDeleteMessage(
  customer: Pick<PartyRow, 'company_name'>,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  return t(
    'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
    { name: customer.company_name },
  )
}
