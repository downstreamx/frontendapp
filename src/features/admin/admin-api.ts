import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

import type { MePayload, PersonNameFields } from '@/features/auth/api'

export type RoleOption = { id: number; name: string; label?: string }

export type UserListRow = PersonNameFields & {
  id: number
  name: string
  email: string
  mobile_no: string | null
  type: string
  avatar: string | null
  company_name?: string
  company_logo?: string | null
  is_enable_login: boolean
  is_disable: boolean
}

export type UsersIndexMeta = {
  roles: Record<string, string>
  companies_context?: boolean
}

export type LoginHistoryRow = {
  id: number
  user: { id: number; name: string; email: string } | null
  ip: string
  details: Record<string, string | null | undefined>
  type: string
  created_at: string
}

export type LoginHistoryIndexMeta = {
  roles: Record<string, string>
}

export type UserFormUser = PersonNameFields & {
  id: number
  name: string
  email: string
  mobile_no: string | null
  type: string
  avatar: string | null
  is_enable_login: boolean
  is_disable: boolean
}

export type UserCreateMeta = {
  roles: Record<string, string>
  available_modules: string[]
  default_modules: string[]
  companies_context?: boolean
}

export type CompanyProfile = {
  company_name: string
  company_address: string
  company_city: string
  company_state: string
  company_country: string
  company_logo?: string | null
}

export type UserEditPayload = {
  user: UserFormUser
  role_id: number | null
  modules: string[]
  roles: Record<string, string>
  available_modules: string[]
  company_profile?: CompanyProfile
}

export type RolePermissionItem = { id: number; name: string; label: string }

export type GroupedRolePermissions = Record<string, Record<string, RolePermissionItem[]>>

export type RoleFormRole = {
  id: number
  name: string
  label: string
  editable: boolean
}

export type RoleListRow = {
  id: number
  name: string
  label: string
  editable: boolean
  permissions_count: number
  users: Array<{ id: number; name: string }>
}

export async function fetchLoginHistoryIndexMeta() {
  const { data } = await api.get<ApiSuccess<LoginHistoryIndexMeta>>('/users/login-history/index-meta')
  return data.data
}

export async function listLoginHistoryPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<LoginHistoryRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/users/login-history', { params })
  return extractPaginatedList<LoginHistoryRow>(data)
}

export async function fetchUsersIndexMeta() {
  const { data } = await api.get<ApiSuccess<UsersIndexMeta>>('/users/index-meta')
  return data.data
}

export async function listUsersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<UserListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/users', { params })
  return extractPaginatedList<UserListRow>(data)
}

export async function impersonateUser(id: number) {
  const { data } = await api.post<
    ApiSuccess<{ token: string; me: MePayload; impersonating: boolean }>
  >(`/users/${id}/impersonate`)
  return data.data
}

export async function leaveImpersonation() {
  const { data } = await api.post<ApiSuccess<{ token: string; me: MePayload }>>(
    '/users/leave-impersonation',
    { device_name: 'spa' },
  )
  return data.data
}

export async function listRoles() {
  const { data } = await api.get<ApiSuccess<unknown>>('/roles')
  return extractListRows<RoleOption>(data)
}

export async function listRolesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<RoleListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/roles', { params })
  return extractPaginatedList<RoleListRow>(data)
}

export async function fetchUserCreateMeta() {
  const { data } = await api.get<ApiSuccess<UserCreateMeta>>('/users/create-meta')
  return data.data
}

export async function fetchUserForEdit(id: string | number) {
  const { data } = await api.get<ApiSuccess<UserEditPayload>>(`/users/${id}`)
  return data.data
}

export async function createUser(payload: PersonNameFields & {
  email: string
  password: string
  password_confirmation: string
  role_id?: number
  mobile_no?: string
  avatar?: string | null
  is_enable_login?: boolean
  modules?: string[]
  company_name?: string
  company_address?: string
  company_city?: string
  company_state?: string
  company_country?: string
}) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>('/users', payload)
  return data.data
}

export async function updateUser(
  id: string | number,
  payload: PersonNameFields & {
    email: string
    mobile_no?: string
    role_id?: number
    avatar?: string | null
    is_enable_login?: boolean
    modules?: string[]
    company_name?: string
    company_address?: string
    company_city?: string
    company_state?: string
    company_country?: string
  },
) {
  const { data } = await api.put<ApiSuccess<{ id: number }>>(`/users/${id}`, payload)
  return data.data
}

export async function changeUserPassword(
  id: string | number,
  payload: { password: string; password_confirmation: string },
) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/users/${id}/change-password`, payload)
  return data.data
}

export async function fetchRoleCreateMeta() {
  const { data } = await api.get<ApiSuccess<{ permissions: GroupedRolePermissions }>>(
    '/roles/create-meta',
  )
  return data.data
}

export async function fetchRoleForEdit(id: string | number) {
  const { data } = await api.get<
    ApiSuccess<{
      role: RoleFormRole
      permissions: GroupedRolePermissions
      role_permissions: string[]
    }>
  >(`/roles/${id}`)
  return data.data
}

export async function createRole(payload: {
  name: string
  label: string
  permissions?: string[]
}) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>('/roles', payload)
  return data.data
}

export async function updateRole(
  id: string | number,
  payload: {
    name?: string
    label: string
    permissions?: string[]
  },
) {
  const { data } = await api.put<ApiSuccess<unknown>>(`/roles/${id}`, payload)
  return data.data
}
