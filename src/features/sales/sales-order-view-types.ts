export type SalesOrderAddress = {
  name?: string
  address_line_1?: string
  city?: string
  state?: string
  zip_code?: string
}

export type SalesOrderLineItem = {
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

export type SalesOrderDetail = {
  id: number
  proposal_number: string
  proposal_date: string
  due_date: string
  customer_id: number
  depot_id?: number | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: string
  display_status: string
  converted_to_invoice: boolean
  invoice_id?: number | null
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
    billing_address?: SalesOrderAddress | null
  } | null
  depot?: { id: number; name: string } | null
  items?: SalesOrderLineItem[]
}
