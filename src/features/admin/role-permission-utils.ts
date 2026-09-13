import type { GroupedRolePermissions, RolePermissionItem } from './admin-api'

export function getModulePermissionNames(modulePermissions: RolePermissionItem[]): string[] {
  return modulePermissions.map((p) => p.name)
}

export function getModuleCheckState(
  modulePermissions: RolePermissionItem[],
  selected: string[],
): { checked: boolean; indeterminate: boolean } {
  const names = getModulePermissionNames(modulePermissions)
  const checkedCount = names.filter((name) => selected.includes(name)).length

  if (checkedCount === 0) return { checked: false, indeterminate: false }
  if (checkedCount === names.length) return { checked: true, indeterminate: false }
  return { checked: false, indeterminate: true }
}

export function toggleModulePermissions(
  modulePermissions: RolePermissionItem[],
  selected: string[],
  checked: boolean,
): string[] {
  const names = getModulePermissionNames(modulePermissions)
  if (checked) {
    return [...new Set([...selected, ...names])]
  }
  return selected.filter((name) => !names.includes(name))
}

export function togglePermission(
  permissionName: string,
  selected: string[],
  checked: boolean,
): string[] {
  if (checked) {
    return selected.includes(permissionName) ? selected : [...selected, permissionName]
  }
  return selected.filter((name) => name !== permissionName)
}

export function filterPermissionAddOns(
  permissions: GroupedRolePermissions,
  searchTerm: string,
  labelForAddOn: (addOn: string) => string,
): string[] {
  const term = searchTerm.trim().toLowerCase()
  return Object.keys(permissions).filter((addOn) => {
    if (!term) return true
    return labelForAddOn(addOn).toLowerCase().includes(term)
  })
}
