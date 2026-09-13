import { hasPermission } from '@/lib/permissions'

export function canDeleteSalesReturn(
  row: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-sales-return-invoices')) {
    return false
  }

  return row.status === 'draft'
}

export function salesReturnDeleteMessage(
  row: { return_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.return_number) {
    return t('Are you sure you want to delete sales return "{{number}}"? This action cannot be undone.', {
      number: row.return_number,
    })
  }

  return t('Are you sure you want to delete this sales return?')
}
