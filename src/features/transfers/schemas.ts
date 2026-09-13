import { z } from 'zod'

export const transferSchema = z.object({
  from_depot: z.coerce.number().min(1),
  to_depot: z.coerce.number().min(1),
  product_id: z.coerce.number().min(1),
  quantity: z.coerce.number().min(0.001),
  notes: z.string().optional(),
})
