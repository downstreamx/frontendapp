import { hasPermission } from '@/lib/permissions'

export function canDeleteSalesOrder(
  row: { status: string; converted_to_invoice?: boolean },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (
    !hasPermission(permissions, roles, userType, 'delete-sales-proposals') &&
    !hasPermission(permissions, roles, userType, 'manage-sales-proposals')
  ) {
    return false
  }

  return row.status === 'draft' && !row.converted_to_invoice
}

export function salesOrderDeleteMessage(
  row: { proposal_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.proposal_number) {
    return t('Are you sure you want to delete sales order "{{number}}"? This action cannot be undone.', {
      number: row.proposal_number,
    })
  }

  return t('Are you sure you want to delete this sales order?')
}
