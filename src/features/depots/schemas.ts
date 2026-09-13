import { z } from 'zod'

export const depotSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  is_active: z.boolean().optional(),
})
