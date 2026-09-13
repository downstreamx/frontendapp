export type SalesInvoiceAddress = {
  name?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  country?: string
  zip_code?: string
}

export type SalesInvoiceLineItem = {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  product?: {
    id: number
    name: string
    sku?: string | null
    description?: string | null
  } | null
  taxes?: Array<{ tax_name: string; tax_rate: number }>
}

export type SalesInvoicePaymentAllocation = {
  id: number
  allocated_amount: number
  payment?: {
    id: number
    payment_number?: string | null
    payment_date?: string
    status?: string
  } | null
}

export type SalesInvoiceDetail = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  customer_id: number
  depot_id?: number | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  status: string
  display_status: string
  type: 'product' | 'service'
  payment_terms?: string | null
  notes?: string | null
  customer?: {
    id: number
    name: string
    email?: string | null
    company_name?: string | null
  } | null
  customer_details?: {
    company_name?: string | null
    billing_address?: SalesInvoiceAddress | null
    shipping_address?: SalesInvoiceAddress | null
  } | null
  depot?: {
    id: number
    name: string
    address?: string | null
  } | null
  items?: SalesInvoiceLineItem[]
  payment_allocations?: SalesInvoicePaymentAllocation[]
}
