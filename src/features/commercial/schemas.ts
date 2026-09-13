import { z } from 'zod'
import type {
  PurchaseLineItemSettings,
  SalesLineItemSettings,
} from '@/features/commercial/line-item-settings-types'

const itemSchema = z.object({
  product_id: z.number().min(1),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  discount_percentage: z.number().min(0).max(100).default(0),
  discount_amount: z.number().default(0),
  tax_percentage: z.number().default(0),
  tax_amount: z.number().default(0),
  total_amount: z.number().default(0),
})

export const commercialInvoiceSchema = z.object({
  invoice_date: z.string().min(1),
  due_date: z.string().optional(),
  customer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  depot_id: z.string().optional(),
  type: z.enum(['product', 'service']),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

const salesInvoiceFormBase = z.object({
  invoice_date: z.string().min(1),
  due_date: z.string().min(1),
  customer_id: z.string().min(1, 'Customer is required'),
  depot_id: z.string().optional(),
  type: z.enum(['product', 'service']),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

const salesInvoiceFormRefine = (
  data: z.infer<typeof salesInvoiceFormBase>,
  ctx: z.RefinementCtx,
) => {
  if (data.type === 'product' && !data.depot_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Depot is required', path: ['depot_id'] })
  }
  const validItems = data.items.filter((item) => item.product_id > 0)
  if (validItems.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one line item', path: ['items'] })
  }
}

export const salesInvoiceCreateSchema = salesInvoiceFormBase.superRefine(salesInvoiceFormRefine)

/** Same rules as create — only draft invoices reach the edit screen. */
export const salesInvoiceEditSchema = salesInvoiceFormBase.superRefine(salesInvoiceFormRefine)

const purchaseInvoiceFormBase = z.object({
  invoice_date: z.string().min(1),
  due_date: z.string().min(1),
  supplier_id: z.string().min(1, 'Supplier is required'),
  depot_id: z.string().min(1, 'Depot is required'),
  loading_depot_id: z.string().optional(),
  type: z.enum(['product', 'service']).default('product'),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

const purchaseInvoiceFormRefine = (
  data: z.infer<typeof purchaseInvoiceFormBase>,
  ctx: z.RefinementCtx,
) => {
  const validItems = data.items.filter((item) => item.product_id > 0)
  if (validItems.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one line item', path: ['items'] })
  }
}

export const purchaseInvoiceCreateSchema =
  purchaseInvoiceFormBase.superRefine(purchaseInvoiceFormRefine)

export const purchaseInvoiceEditSchema =
  purchaseInvoiceFormBase.superRefine(purchaseInvoiceFormRefine)

export const commercialSalesOrderSchema = z.object({
  proposal_date: z.string().min(1),
  due_date: z.string().min(1),
  customer_id: z.coerce.number().min(1),
  depot_id: z.coerce.number().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

/** @deprecated Use {@link commercialSalesOrderSchema}. */
export const commercialProposalSchema = commercialSalesOrderSchema

const salesOrderItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  discount_percentage: z.number().default(0),
  discount_amount: z.number().default(0),
  tax_percentage: z.number().default(0),
  tax_amount: z.number().default(0),
  total_amount: z.number().default(0),
})

export const salesOrderFormSchema = z.object({
  proposal_date: z.string().min(1, 'Order date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  depot_id: z.string().min(1, 'Depot is required'),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1),
})

export type SalesOrderFormSchemaValues = z.infer<typeof salesOrderFormSchema>

export function buildSalesOrderFormSchema(options?: { singleLine?: boolean }) {
  const itemsSchema = options?.singleLine
    ? z.array(salesOrderItemSchema).min(1).max(1)
    : z.array(salesOrderItemSchema).min(1)

  return z.object({
    proposal_date: z.string().min(1, 'Order date is required'),
    due_date: z.string().min(1, 'Due date is required'),
    customer_id: z.string().min(1, 'Customer is required'),
    depot_id: z.string().min(1, 'Depot is required'),
    payment_terms: z.string().optional(),
    notes: z.string().optional(),
    items: itemsSchema,
  })
}

function buildSalesInvoiceFormBase(options?: { singleLine?: boolean }) {
  const itemsSchema = options?.singleLine
    ? z.array(itemSchema).min(1).max(1)
    : z.array(itemSchema).min(1)

  return z.object({
    invoice_date: z.string().min(1),
    due_date: z.string().min(1),
    customer_id: z.string().min(1, 'Customer is required'),
    depot_id: z.string().optional(),
    type: z.enum(['product', 'service']),
    payment_terms: z.string().optional(),
    notes: z.string().optional(),
    items: itemsSchema,
  })
}

export function buildSalesInvoiceCreateSchema(options?: { singleLine?: boolean }) {
  return buildSalesInvoiceFormBase(options).superRefine(salesInvoiceFormRefine)
}

export function buildSalesInvoiceEditSchema(options?: { singleLine?: boolean }) {
  return buildSalesInvoiceFormBase(options).superRefine(salesInvoiceFormRefine)
}

function buildPurchaseInvoiceFormBase(options?: { singleLine?: boolean }) {
  const itemsSchema = options?.singleLine
    ? z.array(itemSchema).min(1).max(1)
    : z.array(itemSchema).min(1)

  return z.object({
    invoice_date: z.string().min(1),
    due_date: z.string().min(1),
    supplier_id: z.string().min(1, 'Supplier is required'),
    depot_id: z.string().min(1, 'Depot is required'),
    loading_depot_id: z.string().optional(),
    type: z.enum(['product', 'service']).default('product'),
    payment_terms: z.string().optional(),
    notes: z.string().optional(),
    items: itemsSchema,
  })
}

export function buildPurchaseInvoiceCreateSchema(options?: { singleLine?: boolean }) {
  return buildPurchaseInvoiceFormBase(options).superRefine(purchaseInvoiceFormRefine)
}

export function buildPurchaseInvoiceEditSchema(options?: { singleLine?: boolean }) {
  return buildPurchaseInvoiceFormBase(options).superRefine(purchaseInvoiceFormRefine)
}

export type { SalesLineItemSettings, PurchaseLineItemSettings }

export const commercialSalesReturnSchema = z.object({
  return_date: z.string().min(1),
  customer_id: z.coerce.number().min(1),
  depot_id: z.coerce.number().optional(),
  original_invoice_id: z.coerce.number().min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export const commercialPurchaseReturnSchema = z.object({
  return_date: z.string().min(1),
  supplier_id: z.coerce.number().min(1),
  depot_id: z.coerce.number().optional(),
  original_invoice_id: z.coerce.number().min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})
