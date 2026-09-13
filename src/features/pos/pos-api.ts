import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type PosSaleTax = {
  id: number
  tax_name: string
  rate: number
}

export type PosSale = {
  id: number
  sale_number?: string
  pos_date: string
  status: string
  depot_id?: number | null
  customer_id?: number | null
  bank_account_id?: number | null
  items_count?: number
  items_total?: number | string | null
  subtotal?: number
  tax_amount?: number
  discount_amount?: number
  total_amount?: number
  created_at?: string
  customer?: { id: number; name: string; email?: string; mobile_no?: string } | null
  depot?: { id: number; name: string } | null
  payment?: {
    discount: number
    amount: number
    discount_amount: number
    final_amount: number
  } | null
  items?: Array<{
    id: number
    product_id: number
    quantity: string | number
    price: string | number
    subtotal?: string | number
    tax_amount?: string | number
    total_amount: string | number
    taxes?: PosSaleTax[]
    product?: { id: number; name: string; sku?: string }
  }>
}

export type PosIndexMeta = {
  statuses: string[]
  depots: Array<{ id: number; name: string }>
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  products: Array<{ id: number; name: string; sku?: string; sale_price?: number | string }>
  bank_accounts?: Array<{
    id: number
    account_name: string
    account_number?: string
    bank_name?: string
  }>
}

export async function fetchPosIndexMeta() {
  const { data } = await api.get<ApiSuccess<PosIndexMeta>>('/pos/pos/index-meta')
  return data.data
}

export async function listPosSalesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<PosSale>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/pos/pos', { params })
  return extractPaginatedList<PosSale>(data)
}

export async function createPosSale(input: {
  pos_date: string
  depot_id: number
  customer_id?: number
  bank_account_id?: number
  status?: string
  discount?: number
  items: Array<{ product_id: number; quantity: number; price: number }>
}) {
  const { data } = await api.post<ApiSuccess<PosSale>>('/pos/pos', input)
  return data.data
}

export async function getPosSale(id: number) {
  const { data } = await api.get<ApiSuccess<PosSale>>(`/pos/pos/${id}`)
  return data.data
}

export async function updatePosSale(
  id: number,
  input: {
    pos_date?: string
    depot_id?: number
    customer_id?: number
    bank_account_id?: number
    status?: string
    discount?: number
    items?: Array<{ product_id: number; quantity: number; price: number }>
  },
) {
  const { data } = await api.put<ApiSuccess<PosSale>>(`/pos/pos/${id}`, input)
  return data.data
}

export async function fetchPosBarcodeMeta() {
  const { data } = await api.get<ApiSuccess<{ depots: Array<{ id: number; name: string }> }>>(
    '/pos/barcode/meta',
  )
  return data.data
}

export async function fetchPosBarcodeProducts(depotId: number) {
  const { data } = await api.get<
    ApiSuccess<{ products: Array<{ id: number; name: string; sku?: string; sale_price?: number }> }>
  >('/pos/barcode/products', { params: { depot_id: depotId } })
  return data.data.products
}

export async function downloadPosBarcodePdf(input: {
  depot_id: number
  items: Array<{ product_id: number; copies?: number }>
}) {
  const { data } = await api.post<Blob>('/pos/barcode/print', input, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })

  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'product-barcodes.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export type PosSalesReport = {
  sales?: { data: PosSale[] }
  daily_sales: Array<{ date: string; sales: number; count: number }>
  monthly_sales: Array<{ month: string; sales: number; count: number }>
  depot_sales: Array<{ name: string; sales: number; count: number }>
}

export type PosProductReportRow = {
  name: string
  sku?: string
  total_quantity: number
  total_revenue: number
  total_orders: number
}

export type PosCustomerReportRow = {
  name: string
  email?: string
  total_spent: number
  order_count: number
  average_order: number
}

export type PosDashboard = {
  stats: {
    today_sales: number
    week_sales: number
    month_sales: number
    total_sales: number
    total_revenue: number
    avg_transaction: number
    total_products: number
    low_stock_products: number
    total_customers: number
    walk_in_sales: number
  }
  top_products: Array<{
    name: string
    total_quantity: number
    total_revenue: number
  }>
  recent_sales: Array<{
    id: number
    sale_number?: string
    total: number
    created_at?: string
    customer?: { name: string } | null
    depot?: { name: string } | null
  }>
  sales_by_status: Record<string, number>
  last_10_days_sales: Array<{ date: string; sales: number }>
  out_of_stock_products: Array<{
    product_name: string
    sku: string
    depot_name: string
    stock: number
  }>
}

export type PosTerminalTax = { id: number; name: string; rate: number }

export type PosTerminalProduct = {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  category?: string | null
  image?: string | null
  taxes: PosTerminalTax[]
}

export type PosTerminalMeta = {
  depots: Array<{ id: number; name: string; address?: string }>
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  categories: Array<{ id: number; name: string; color?: string }>
  bank_accounts: Array<{
    id: number
    account_name: string
    account_number?: string
    bank_name?: string
  }>
}

export async function fetchPosTerminalMeta() {
  const { data } = await api.get<ApiSuccess<PosTerminalMeta>>('/pos/terminal/meta')
  return data.data
}

export async function fetchPosTerminalProducts(params: {
  depot_id: number
  category_id?: number
  search?: string
}) {
  const { data } = await api.get<ApiSuccess<{ products: PosTerminalProduct[] }>>(
    '/pos/terminal/products',
    { params },
  )
  return data.data.products
}

export async function fetchPosDashboard() {
  const { data } = await api.get<ApiSuccess<PosDashboard>>('/pos/dashboard')
  return data.data
}

export async function fetchPosSalesReport() {
  const { data } = await api.get<ApiSuccess<PosSalesReport>>('/pos/reports/sales')
  return data.data
}

export async function fetchPosProductReport() {
  const { data } = await api.get<ApiSuccess<{ products: PosProductReportRow[] }>>('/pos/reports/products')
  return data.data.products
}

export async function fetchPosCustomerReport() {
  const { data } = await api.get<ApiSuccess<{ customers: PosCustomerReportRow[] }>>('/pos/reports/customers')
  return data.data.customers
}
