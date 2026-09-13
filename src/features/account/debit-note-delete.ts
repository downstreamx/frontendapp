import { hasPermission } from '@/lib/permissions'

export function canDeleteDebitNote(
  row: { status: string },
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  if (!hasPermission(permissions, roles, userType, 'delete-debit-notes')) {
    return false
  }

  return row.status === 'draft'
}

export function debitNoteDeleteMessage(
  row: { debit_note_number?: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (row.debit_note_number) {
    return t('Are you sure you want to delete this debit note?')
  }

  return t('Are you sure you want to delete this debit note?')
}
