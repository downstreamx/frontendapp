export type SalesReturnAddress = {
  name?: string
  address_line_1?: string
  city?: string
  state?: string
  zip_code?: string
}

export type SalesReturnLineItem = {
  id: number
  product_id: number
  original_invoice_item_id?: number | null
  return_quantity: number
  original_quantity?: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  reason?: string | null
  product?: { id: number; name: string; sku?: string | null } | null
  taxes?: Array<{ tax_name: string; tax_rate: number }>
}

export type SalesReturnDetail = {
  id: number
  return_number: string
  return_date: string
  customer_id: number
  depot_id?: number | null
  original_invoice_id: number
  reason?: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: string
  notes?: string | null
  customer?: {
    id: number
    name: string
    email?: string | null
    company_name?: string | null
  } | null
  customer_details?: {
    company_name?: string | null
    billing_address?: SalesReturnAddress | null
    shipping_address?: SalesReturnAddress | null
  } | null
  depot?: { id: number; name: string } | null
  original_invoice?: { id: number; invoice_number: string } | null
  credit_note?: {
    id: number
    credit_note_number: string
    status: string
  } | null
  items?: SalesReturnLineItem[]
}
