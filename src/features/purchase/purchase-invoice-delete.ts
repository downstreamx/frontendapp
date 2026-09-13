import { hasPermission } from '@/lib/permissions'

export function canDeletePurchaseInvoice(
  invoice: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-purchase-invoices')) {
    return false
  }

  return invoice.status === 'draft'
}

export function purchaseInvoiceDeleteMessage(
  invoice: { invoice_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (invoice.invoice_number) {
    return t(
      'Are you sure you want to delete purchase invoice "{{number}}"? This action cannot be undone.',
      { number: invoice.invoice_number },
    )
  }

  return t('Are you sure you want to delete this purchase invoice?')
}
