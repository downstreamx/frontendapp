export function hasPermission(
  permissions: string[],
  roles: string[],
  userType: string | undefined,
  permission?: string,
): boolean {
  if (!permission) return true
  if (
    roles.includes('company') ||
    roles.includes('superadmin') ||
    userType === 'company' ||
    userType === 'superadmin' ||
    permissions.includes('manage-settings')
  ) {
    return true
  }
  return permissions.includes(permission)
}
