import type { ComponentType } from 'react'
import type { NavItem } from '@/types'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { getSuperAdminMenu } from '@/config/menus/superadmin-menu'
import { getCompanyMenu } from '@/config/menus/company-menu'
import { getClientPortalMenu } from '@/config/menus/client-portal-menu'
import { hasPermission } from '@/lib/permissions'
import { posMenuPermissionAllowed } from '@/lib/pos-permissions'
import * as LucideIcons from 'lucide-react'

const getCoreMenuItems = (
  userRoles: string[],
  userType: string | undefined,
  t: (key: string) => string,
): NavItem[] => {
  if (userRoles.includes('superadmin')) {
    return getSuperAdminMenu(t)
  }
  if (userType === 'customer') {
    return getClientPortalMenu(t)
  }
  return getCompanyMenu(t)
}

const getCustomMenuItems = (_userRoles: string[], customMenus: unknown[], t: (key: string) => string): NavItem[] => {
  if (!Array.isArray(customMenus)) {
    return []
  }
  return customMenus.map((menu) => {
    const entry = menu as Record<string, unknown>
    let iconComponent = null
    if (entry.icon && typeof entry.icon === 'string') {
      const IconComponent = (LucideIcons as Record<string, unknown>)[entry.icon] as
        | ComponentType<{ className?: string }>
        | undefined
      if (IconComponent) {
        iconComponent = IconComponent
      }
    }
    return {
      ...(entry as unknown as NavItem),
      icon: iconComponent,
      title: t(String(entry.title ?? '')),
    }
  })
}

/**
 * Hide optional Workdo sections when the module is not activated for the company.
 * Core petroleum sections (dashboard, depots, users, settings) have no `modules` key.
 */
export function filterByActiveModules(items: NavItem[], activatedModules: string[]): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (item.modules && item.modules.length > 0) {
      const allowed = item.modules.some((mod) => activatedModules.includes(mod))
      if (!allowed) {
        return acc
      }
    }

    const children = item.children ? filterByActiveModules(item.children, activatedModules) : undefined

    acc.push(children ? { ...item, children } : item)
    return acc
  }, [])
}

function menuItemAllowed(
  permission: string | undefined,
  permissions: string[],
  roles: string[],
  userType?: string,
): boolean {
  const auth = { permissions, roles, userType }
  if (
    permission === 'create-pos' ||
    permission === 'manage-pos-barcodes' ||
    permission === 'print-pos-barcodes'
  ) {
    return posMenuPermissionAllowed(permission, auth)
  }
  return hasPermission(permissions, roles, userType, permission)
}

/** Matches legacy sidebar filtering: permission on leaf nodes; parents need permission + visible children. */
export function filterByPermission(
  items: NavItem[],
  permissions: string[],
  roles: string[] = [],
  userType?: string,
): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (item.children) {
      const children = filterByPermission(item.children, permissions, roles, userType)
      if (children.length === 0) {
        return acc
      }

      if (!item.permission) {
        acc.push({ ...item, children })
        return acc
      }

      if (!menuItemAllowed(item.permission, permissions, roles, userType)) {
        return acc
      }

      acc.push({ ...item, children })
      return acc
    }

    if (menuItemAllowed(item.permission, permissions, roles, userType)) {
      acc.push(item)
    }

    return acc
  }, [])
}

export function useMenuItems(): NavItem[] {
  const { auth } = useAppContext()
  const { t } = useTranslation()

  const core = getCoreMenuItems(auth.roles, auth.user?.type, t)
  const custom = getCustomMenuItems(auth.roles, [], t)
  const merged = [...core, ...custom].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  const withModules = filterByActiveModules(merged, auth.activatedPackages)
  return filterByPermission(withModules, auth.permissions, auth.roles, auth.user?.type)
}

export const allMenuItems = { useMenuItems }
