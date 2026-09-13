import {
  lookupOptionValue,
  toProductLookupOptions,
  toTruckLookupOptions,
  type LookupOption,
  type ProductLookupRow,
  type TruckLookupRow,
} from '@/features/_shared/operations-lookups'
import { formatQuantityInputString } from '@/lib/format-quantity'
import type { DistributionField } from './distribution-api'
import type { DistributionLookupKey } from './hooks/use-distribution-meta'

function relationKeysForField(fieldName: string): string[] {
  const base = fieldName.replace(/_id$/, '')
  const camel = base.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
  return [fieldName, base, camel]
}

function nestedRelation(record: Record<string, unknown>, fieldName: string): Record<string, unknown> | null {
  for (const key of relationKeysForField(fieldName)) {
    const value = record[key]
    if (value && typeof value === 'object' && 'id' in value) {
      return value as Record<string, unknown>
    }
  }
  return null
}

export function relationIdFromRecord(
  record: Record<string, unknown>,
  fieldName: string,
): string {
  const direct = record[fieldName]
  if (direct != null && direct !== '') {
    if (typeof direct === 'object' && 'id' in direct) {
      return String((direct as { id: number }).id)
    }
    if (typeof direct !== 'object') {
      return String(direct)
    }
  }

  const nested = nestedRelation(record, fieldName)
  return nested?.id != null ? String(nested.id) : ''
}

function isQuantityField(field: DistributionField): boolean {
  return field.type === 'number' && !field.lookup
}

export function recordFieldToFormValue(
  record: Record<string, unknown>,
  field: DistributionField,
): string {
  if (field.lookup) {
    return relationIdFromRecord(record, field.name)
  }

  const raw = record[field.name]
  if (raw == null || raw === '') {
    return ''
  }

  if (field.type === 'date' || field.type === 'datetime-local') {
    return String(raw).slice(0, field.type === 'date' ? 10 : 16)
  }

  const str = String(raw)
  return isQuantityField(field) ? formatQuantityInputString(str) : str
}

export function recordToDistributionFormState(
  record: Record<string, unknown>,
  fields: DistributionField[],
): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => [field.name, recordFieldToFormValue(record, field)]),
  )
}

function depotLabel(depot: { name?: string; city?: string }): string {
  return depot.city ? `${depot.name ?? ''} (${depot.city})` : String(depot.name ?? '')
}

export function augmentLookupOptionsForRecord(
  options: LookupOption[],
  field: DistributionField,
  record: Record<string, unknown> | undefined,
): LookupOption[] {
  if (!record?.id || !field.lookup) {
    return options
  }

  const selectedId = relationIdFromRecord(record, field.name)
  if (!selectedId || options.some((option) => lookupOptionValue(option) === selectedId)) {
    return options
  }

  const relation = nestedRelation(record, field.name)
  if (!relation) {
    return options
  }

  const lookup = field.lookup as DistributionLookupKey
  switch (lookup) {
    case 'truck':
      return [
        ...options,
        ...toTruckLookupOptions([
          {
            id: Number(relation.id),
            plate_number: relation.plate_number as string | undefined,
            make: relation.make as string | null | undefined,
            truck_model: relation.truck_model as string | null | undefined,
            avatar: relation.avatar as string | null | undefined,
          } satisfies TruckLookupRow,
        ]),
      ]
    case 'product':
      return [
        ...options,
        ...toProductLookupOptions([
          {
            id: Number(relation.id),
            name: String(relation.name ?? `#${String(relation.id)}`),
            sku: relation.sku as string | null | undefined,
            image: relation.image as string | null | undefined,
          } satisfies ProductLookupRow,
        ]),
      ]
    case 'depot':
      return [
        ...options,
        {
          id: Number(relation.id),
          label: depotLabel({
            name: relation.name as string | undefined,
            city: relation.city as string | undefined,
          }),
        },
      ]
    default:
      return [
        ...options,
        {
          id: Number(relation.id),
          label: String(relation.name ?? relation.label ?? `#${String(relation.id)}`),
        },
      ]
  }
}
