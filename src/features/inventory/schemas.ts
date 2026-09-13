import { z } from 'zod'

const itemType = z.enum(['product', 'service', 'part'])

export const productCreateSchema = z
  .object({
    name: z.string().min(1),
    sku: z.string().min(1),
    tax_ids: z.array(z.string()).min(1),
    category_id: z.coerce.number().min(1),
    description: z.string().optional(),
    long_description: z.string().optional(),
    sale_price: z.coerce.number().min(0),
    purchase_price: z.coerce.number().min(0),
    unit: z.coerce.number().min(1),
    quantity: z.coerce.number().min(0).optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    depot_id: z.coerce.number().optional(),
    type: itemType.default('product'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'service') return
    if (data.quantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quantity is required',
        path: ['quantity'],
      })
    }
    if (!data.depot_id || data.depot_id < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Depot is required',
        path: ['depot_id'],
      })
    }
  })

export const productEditSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  tax_ids: z.array(z.string()).min(1),
  category_id: z.coerce.number().min(1),
  description: z.string().optional(),
  long_description: z.string().optional(),
  sale_price: z.coerce.number().min(0),
  purchase_price: z.coerce.number().min(0),
  unit: z.coerce.number().min(1),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  type: itemType,
  is_active: z.boolean().optional(),
})

/** @deprecated use productCreateSchema / productEditSchema */
export const productSchema = productEditSchema
