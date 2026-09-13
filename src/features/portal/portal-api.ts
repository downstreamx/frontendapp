import { api, type ApiSuccess } from '@/lib/api'
import type { BridgingReportResponse } from '@/features/reports/reports-api'

export type PortalDashboard = {
  open_invoices: number
  undistributed_qty: number
  total_paid_qty: number
  total_distributed_qty: number
  recent_loads: Array<{
    id: number
    load_number: string
    phase: string
    invoice_number?: string
    loading_date: string
    quantity: number
    truck?: string
  }>
}

export type PortalInvoiceRow = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  balance_amount: number
  status: string
  paid_qty: number
  distributed_qty: number
  undistributed_qty: number
  distribution_status: string
}

export type PortalInvoicesResponse = {
  data: PortalInvoiceRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type PortalTruckLoadTimeline = {
  invoice: {
    id: number
    invoice_number: string
    invoice_date: string
    status: string
    distribution_status: string
    undistributed_qty: number
  }
  timeline: Array<{
    id: number
    load_number: string
    phase: string
    loading_date: string
    quantity: number
    assigned_qty?: number
    delivered_qty?: number
    destination?: string
    waybill_number?: string
    truck?: string
    depot?: string
    driver?: string
  }>
}

async function fetchPortal<T>(path: string, params?: Record<string, string>): Promise<T> {
  const { data } = await api.get<ApiSuccess<T>>(path, { params })
  return data.data
}

export const fetchPortalDashboard = () => fetchPortal<PortalDashboard>('/portal/dashboard')

export const fetchPortalInvoices = (params?: Record<string, string>) =>
  fetchPortal<PortalInvoicesResponse>('/portal/invoices', params)

export const fetchPortalInvoiceTruckLoadTimeline = (invoiceId: string | number) =>
  fetchPortal<PortalTruckLoadTimeline>(`/portal/invoices/${invoiceId}/truck-load-timeline`)

export const fetchPortalDistributionReport = (params?: Record<string, string>) =>
  fetchPortal<BridgingReportResponse>('/portal/distribution-report', params)
