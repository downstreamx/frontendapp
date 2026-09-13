import { hasPermission } from '@/lib/permissions'

type AuthSlice = {
  permissions: string[]
  roles: string[]
  userType?: string
}

/** Checkout terminal — legacy `create-pos`; admins often only have `manage-pos`. */
export function canCreatePos(auth: AuthSlice): boolean {
  return (
    hasPermission(auth.permissions, auth.roles, auth.userType, 'create-pos') ||
    hasPermission(auth.permissions, auth.roles, auth.userType, 'manage-pos')
  )
}

/** Barcode labels — legacy `manage-pos-barcodes` or print-only role. */
export function canManagePosBarcodes(auth: AuthSlice): boolean {
  return (
    hasPermission(auth.permissions, auth.roles, auth.userType, 'manage-pos-barcodes') ||
    hasPermission(auth.permissions, auth.roles, auth.userType, 'print-pos-barcodes') ||
    hasPermission(auth.permissions, auth.roles, auth.userType, 'manage-pos')
  )
}

export function posMenuPermissionAllowed(
  permission: string | undefined,
  auth: AuthSlice,
): boolean {
  if (!permission) return true
  if (permission === 'create-pos') return canCreatePos(auth)
  if (permission === 'manage-pos-barcodes') return canManagePosBarcodes(auth)
  return hasPermission(auth.permissions, auth.roles, auth.userType, permission)
}
