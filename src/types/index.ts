import type { LucideIcon } from 'lucide-react'

export interface User {
  id: number
  name: string
  email: string
  type: string
  email_verified_at?: string
  lang?: string
  permissions?: string[]
}

export interface NavItem {
  title: string
  href?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | null
  permission?: string
  children?: NavItem[]
  isActive?: boolean
  parent?: string
  name?: string
  order?: number
  /** Workdo module names — section hidden unless at least one is in activated_modules */
  modules?: string[]
  /** Mega menu column header when children are flat leaves */
  megaMenuGroup?: string
  /** When true, href only matches the exact pathname (not nested routes). */
  matchExact?: boolean
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  auth: {
    user: User
    permissions?: string[]
    roles?: string[]
    activatedPackages?: string[]
    impersonating?: boolean
    lang?: string
  }
  companyAllSetting?: Record<string, string>
  adminAllSetting?: Record<string, string>
  imageUrlPrefix?: string
  is_demo?: boolean
}

export type { PaginatedListMeta as PaginationMeta } from '@/components/ui/pagination'
