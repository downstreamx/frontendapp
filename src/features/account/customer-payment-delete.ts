import { hasPermission } from '@/lib/permissions'

export function canDeleteCustomerPayment(
  row: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-customer-payments')) {
    return false
  }

  return row.status === 'pending'
}

export function customerPaymentDeleteMessage(
  row: { payment_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.payment_number) {
    return t('Are you sure you want to delete payment "{{number}}"? This action cannot be undone.', {
      number: row.payment_number,
    })
  }

  return t('Are you sure you want to delete this payment?')
}
