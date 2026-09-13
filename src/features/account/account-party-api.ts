import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import { createRestCrudApi } from '@/lib/crud-api'
import type { SetupCategoryOption, SetupPaymentTermOption } from '@/lib/setup-lookup-types'
import type { CustomerBalanceMetrics } from './account-customer-balance-api'

export type PartyUser = {
  id: number
  name: string
  avatar?: string | null
  is_disable?: boolean
}

export type SupplierPurchaseHistoryRow = {
  id: number
  invoice_number: string
  invoice_date: string
  total_amount: number
  balance_amount: number
  status: string
  bridged_qty: number
}

export type PartyRow = {
  id: number
  user_id?: number | null
  customer_code?: string
  supplier_code?: string
  company_name: string
  company_logo?: string | null
  opening_balance_debit?: number
  opening_balance_credit?: number
  opening_balance_as_of?: string | null
  purchase_history?: SupplierPurchaseHistoryRow[]
  contact_person_name: string
  contact_person_email?: string
  contact_person_mobile?: string
  tax_number?: string
  payment_terms?: string
  credit_limit?: number | null
  supplier_category_id?: number | null
  customer_category_id?: number | null
  supplier_category?: SetupCategoryOption | null
  customer_category?: SetupCategoryOption | null
  notes?: string
  billing_address?: Record<string, string>
  shipping_address?: Record<string, string>
  same_as_billing?: boolean
  user?: PartyUser | null
  balance?: CustomerBalanceMetrics
  /** Credit limit headroom (limit minus closing AR). */
  available_credit_limit?: number
}

export type CustomerCreateMetaUser = {
  id: number
  name: string
  email: string
  mobile_no?: string | null
}

export type CustomerCreateMeta = {
  users: CustomerCreateMetaUser[]
  payment_terms: SetupPaymentTermOption[]
  customer_categories: SetupCategoryOption[]
}

export type CustomerEditMeta = {
  customer: PartyRow
  payment_terms: SetupPaymentTermOption[]
  customer_categories: SetupCategoryOption[]
}

export type SupplierCreateMeta = {
  users: CustomerCreateMetaUser[]
  payment_terms: SetupPaymentTermOption[]
  supplier_categories: SetupCategoryOption[]
}

export type SupplierEditMeta = {
  supplier: PartyRow
  payment_terms: SetupPaymentTermOption[]
  supplier_categories: SetupCategoryOption[]
}

export type PartyPayload = {
  user_id?: number | null
  company_name: string
  company_logo?: string | null
  contact_person_name: string
  contact_person_email?: string
  contact_person_mobile?: string
  tax_number?: string
  payment_terms?: string
  supplier_category_id?: number | null
  customer_category_id?: number | null
  notes?: string
  billing_address: Record<string, string>
  shipping_address?: Record<string, string>
  same_as_billing?: boolean
}

const customersApi = createRestCrudApi<PartyRow>('/account/customers')
const suppliersApi = createRestCrudApi<PartyRow>('/account/suppliers')

export const listCustomers = customersApi.list

export async function listCustomersPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<PartyRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/account/customers', { params })
  return extractPaginatedList<PartyRow>(data)
}

export async function fetchCustomerCreateMeta(): Promise<CustomerCreateMeta> {
  const { data } = await api.get<ApiSuccess<CustomerCreateMeta>>('/account/customers/create-meta')
  return data.data
}

export async function fetchCustomerEditMeta(id: string | number): Promise<CustomerEditMeta> {
  const { data } = await api.get<ApiSuccess<CustomerEditMeta>>(`/account/customers/${id}/edit-meta`)
  return data.data
}

export async function getCustomer(id: string | number): Promise<PartyRow> {
  const { data } = await api.get<ApiSuccess<PartyRow>>(`/account/customers/${id}`)
  return data.data
}

export const createCustomer = customersApi.create
export const updateCustomer = customersApi.update
export const deleteCustomer = customersApi.remove

export const listSuppliers = suppliersApi.list

export async function listSuppliersPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<PartyRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/account/suppliers', { params })
  return extractPaginatedList<PartyRow>(data)
}

export async function getSupplier(id: string | number): Promise<PartyRow> {
  const { data } = await api.get<ApiSuccess<PartyRow>>(`/account/suppliers/${id}`)
  return data.data
}

export async function fetchSupplierCreateMeta(): Promise<SupplierCreateMeta> {
  const { data } = await api.get<ApiSuccess<SupplierCreateMeta>>('/account/suppliers/create-meta')
  return data.data
}

export async function fetchSupplierEditMeta(id: string | number): Promise<SupplierEditMeta> {
  const { data } = await api.get<ApiSuccess<SupplierEditMeta>>(`/account/suppliers/${id}/edit-meta`)
  return data.data
}

export const createSupplier = suppliersApi.create
export const updateSupplier = suppliersApi.update
export const deleteSupplier = suppliersApi.remove

export async function listPartyRows(endpoint: '/account/customers' | '/account/suppliers') {
  const { data } = await api.get<ApiSuccess<unknown>>(endpoint)
  return extractListRows<PartyRow>(data)
}
