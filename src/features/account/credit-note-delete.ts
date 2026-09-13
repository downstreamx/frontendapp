import { hasPermission } from '@/lib/permissions'

export function canDeleteCreditNote(
  row: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-credit-notes')) {
    return false
  }

  return row.status === 'draft'
}

export function creditNoteDeleteMessage(
  row: { credit_note_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.credit_note_number) {
    return t('Are you sure you want to delete this credit note?')
  }

  return t('Are you sure you want to delete this credit note?')
}
