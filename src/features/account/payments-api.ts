import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import {
  buildCreateCustomerPaymentFormData,
  type CreateCustomerPaymentPayload,
} from './customer-payment-payload'
import {
  buildCreateSupplierPaymentFormData,
  type CreateSupplierPaymentPayload,
} from './supplier-payment-payload'
import type { CustomerPayment } from './types'

const customerBase = '/account/customer-payments'
const supplierBase = '/account/supplier-payments'

export type CustomerPaymentRow = CustomerPayment & {
  bank_account?: { id: number; account_name: string; account_number?: string | null }
}

export type CustomerPaymentsIndexMeta = {
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  bank_accounts: Array<{
    id: number
    account_name: string
    account_number?: string | null
    current_balance?: number
  }>
}

export type SupplierPaymentRow = {
  id: number
  payment_number?: string
  payment_date: string
  payment_amount: number | string
  reference_number?: string
  status: string
  notes?: string
  created_at?: string
  attachment?: string | null
  supplier?: { id: number; name: string; email?: string; company_name?: string | null }
  bank_account?: { id: number; account_name: string; account_number?: string | null }
  allocations?: CustomerPayment['allocations']
  debit_note_applications?: Array<{
    id: number
    applied_amount: number | string
    application_date?: string
    debit_note?: { id: number; debit_note_number?: string }
  }>
  debitNoteApplications?: SupplierPaymentRow['debit_note_applications']
}

export type SupplierPaymentsIndexMeta = {
  suppliers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  bank_accounts: Array<{
    id: number
    account_name: string
    account_number?: string | null
    current_balance?: number
  }>
}

export async function fetchCustomerPaymentsIndexMeta(): Promise<CustomerPaymentsIndexMeta> {
  const { data } = await api.get<ApiSuccess<CustomerPaymentsIndexMeta>>(`${customerBase}/index-meta`)
  return data.data
}

export async function listCustomerPaymentsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<CustomerPaymentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(customerBase, { params })
  return extractPaginatedList<CustomerPaymentRow>(data)
}

export async function listCustomerPayments(params?: Record<string, string | number>) {
  const { data } = await api.get<ApiSuccess<unknown>>(customerBase, { params })
  return extractListRows<CustomerPaymentRow>(data)
}

export async function getCustomerPayment(id: string | number) {
  const { data } = await api.get<ApiSuccess<CustomerPayment>>(`${customerBase}/${id}`)
  return data.data
}

export async function getCustomerPaymentCreateMeta() {
  const { data } = await api.get<
    ApiSuccess<{
      customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
      bank_accounts: Array<{ id: number; account_name: string; account_number?: string }>
    }>
  >(`${customerBase}/create-meta`)
  return data.data
}

export async function getOutstandingInvoices(customerId: string | number) {
  const { data } = await api.get<
    ApiSuccess<{
      invoices: Array<Record<string, unknown>>
      creditNotes: Array<Record<string, unknown>>
    }>
  >(`${customerBase}/customers/${customerId}/outstanding`)
  return data.data
}

export async function createCustomerPayment(body: CreateCustomerPaymentPayload) {
  const { data } = await api.post<ApiSuccess<CustomerPayment>>(
    customerBase,
    buildCreateCustomerPaymentFormData(body),
  )
  return data.data
}

export async function updateCustomerPaymentStatus(
  id: string | number,
  status: 'cleared' | 'cancelled' | 'voided',
) {
  const { data } = await api.patch<ApiSuccess<CustomerPayment>>(`${customerBase}/${id}/status`, { status })
  return data.data
}

export async function deleteCustomerPayment(id: string | number): Promise<void> {
  await api.delete(`${customerBase}/${id}`)
}

export async function fetchSupplierPaymentsIndexMeta(): Promise<SupplierPaymentsIndexMeta> {
  const { data } = await api.get<ApiSuccess<SupplierPaymentsIndexMeta>>(`${supplierBase}/index-meta`)
  return data.data
}

export async function listSupplierPaymentsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<SupplierPaymentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(supplierBase, { params })
  return extractPaginatedList<SupplierPaymentRow>(data)
}

export async function listSupplierPayments(params?: Record<string, string | number>) {
  const { data } = await api.get<ApiSuccess<unknown>>(supplierBase, { params })
  return extractListRows<SupplierPaymentRow>(data)
}

export async function getSupplierPayment(id: string | number) {
  const { data } = await api.get<ApiSuccess<SupplierPaymentRow>>(`${supplierBase}/${id}`)
  return data.data
}

export async function getSupplierPaymentCreateMeta() {
  const { data } = await api.get<ApiSuccess<SupplierPaymentsIndexMeta>>(`${supplierBase}/create-meta`)
  return data.data
}

export async function getSupplierOutstanding(supplierId: string | number) {
  const { data } = await api.get<
    ApiSuccess<{
      invoices: Array<Record<string, unknown>>
      debitNotes: Array<Record<string, unknown>>
    }>
  >(`${supplierBase}/suppliers/${supplierId}/outstanding`)
  return data.data
}

export async function createSupplierPayment(body: CreateSupplierPaymentPayload) {
  const { data } = await api.post<ApiSuccess<SupplierPaymentRow>>(
    supplierBase,
    buildCreateSupplierPaymentFormData(body),
  )
  return data.data
}

export async function updateSupplierPaymentStatus(
  id: string | number,
  status: 'cleared' | 'cancelled' | 'voided',
) {
  const { data } = await api.patch<ApiSuccess<SupplierPaymentRow>>(`${supplierBase}/${id}/status`, { status })
  return data.data
}

export async function deleteSupplierPayment(id: string | number): Promise<void> {
  await api.delete(`${supplierBase}/${id}`)
}
