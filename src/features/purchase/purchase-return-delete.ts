import { hasPermission } from '@/lib/permissions'

export function canDeletePurchaseReturn(
  row: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-purchase-return-invoices')) {
    return false
  }

  return row.status === 'draft'
}

export function purchaseReturnDeleteMessage(
  row: { return_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.return_number) {
    return t('Are you sure you want to delete purchase return "{{number}}"? This action cannot be undone.', {
      number: row.return_number,
    })
  }

  return t('Are you sure you want to delete this purchase return?')
}
