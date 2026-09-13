import { z } from 'zod'

const optionalText = z.string().trim().optional()

export const storeTruckLoadFormSchema = z.object({
  entitlement_id: z.string().min(1, 'Product entitlement is required'),
  truck_id: z.string().min(1, 'Truck is required'),
  driver_id: z.string().optional(),
  loading_depot_id: z.string().min(1, 'Loading depot is required'),
  loading_date: z.string().min(1, 'Loading date is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  destination: z.string().trim().min(1, 'Destination is required').max(255),
  waybill_number: optionalText,
  meter_number: optionalText,
  notes: optionalText,
})

/** Shared fields for multi-truck bridging create (quantities per truck are validated in the dialog). */
export const bulkStoreTruckLoadFormSchema = z.object({
  entitlement_id: z.string().min(1, 'Product entitlement is required'),
  loading_depot_id: z.string().min(1, 'Loading depot is required'),
  loading_date: z.string().min(1, 'Loading date is required'),
  destination: z.string().trim().min(1, 'Destination is required').max(255),
  waybill_number: optionalText,
  meter_number: optionalText,
  notes: optionalText,
})

export type BulkStoreTruckLoadFormValues = z.infer<typeof bulkStoreTruckLoadFormSchema>

export type StoreTruckLoadFormValues = z.infer<typeof storeTruckLoadFormSchema>

export function parseStoreTruckLoadQuantity(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim()
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function validateStoreTruckLoadQuantity(
  raw: string,
  maxBalance?: number,
): string | null {
  const value = parseStoreTruckLoadQuantity(raw)
  if (value == null) return 'Enter a valid quantity.'
  if (value <= 0) return 'Quantity must be greater than zero.'
  if (maxBalance != null && value > maxBalance) {
    return 'Quantity exceeds entitlement balance.'
  }
  return null
}

export const assignTruckLoadFormSchema = z.object({
  truck_load_id: z.string().min(1, 'Loaded truck is required'),
  customer_stock_balance_id: z.string().min(1, 'Customer entitlement is required'),
  quantity: z.string().min(1, 'Quantity is required'),
})

export type AssignTruckLoadFormValues = z.infer<typeof assignTruckLoadFormSchema>

export function validateAssignTruckLoadQuantity(
  raw: string,
  maxBalance: number,
  maxOnLoad: number,
): string | null {
  const value = parseStoreTruckLoadQuantity(raw)
  if (value == null) return 'Enter a valid quantity.'
  if (value <= 0) return 'Quantity must be greater than zero.'
  if (value > maxBalance) return 'Quantity exceeds remaining customer distribution balance.'
  if (value > maxOnLoad) return 'Quantity exceeds remaining load quantity available to assign.'
  return null
}
