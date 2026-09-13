export type CommercialInvoiceItem = {
  id?: number
  product_id: number
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  taxes?: Array<{ tax_name: string; tax_rate: number }>
}

export type CommercialProduct = {
  id: number
  name: string
  sale_price: number
  purchase_price?: number
  unit?: string
  stock_quantity?: number
  image?: string | null
  taxes?: Array<{ id: number; tax_name: string; rate: number }>
}

export type CommercialInvoiceFormValues = {
  invoice_date: string
  due_date: string
  customer_id: string
  supplier_id?: string
  depot_id: string
  loading_depot_id?: string
  type: 'product' | 'service'
  payment_terms: string
  notes: string
  items: CommercialInvoiceItem[]
}
