import { hasPermission } from '@/lib/permissions'

export function canDeleteSalesOrder(
  row: { status: string; converted_to_invoice?: boolean },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (
    !hasPermission(permissions, roles, userType, 'delete-sales-orders') &&
    !hasPermission(permissions, roles, userType, 'manage-sales-orders')
  ) {
    return false
  }

  return row.status === 'draft' && !row.converted_to_invoice
}

export function salesOrderDeleteMessage(
  row: { order_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const number = row.order_number
  if (number) {
    return t('Are you sure you want to delete sales order "{{number}}"? This action cannot be undone.', {
      number,
    })
  }

  return t('Are you sure you want to delete this sales order?')
}
