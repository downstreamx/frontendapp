export function personName(
  person?: { name?: string; email?: string } | null,
  fallbackId?: number,
): string {
  const name = person?.name?.trim()
  if (name) return name
  const email = person?.email?.trim()
  if (email) return email
  return fallbackId != null ? `#${fallbackId}` : '—'
}

export function formatShortDate(value?: string | null): string {
  if (!value) return ''
  return String(value).slice(0, 10)
}

export function truckLabel(
  truck?: { plate_number?: string; make?: string; truck_model?: string } | null,
  fallbackId?: number,
): string {
  const plate = truck?.plate_number?.trim()
  if (plate) return plate
  const descriptor = [truck?.make, truck?.truck_model].filter(Boolean).join(' ').trim()
  if (descriptor) return descriptor
  return fallbackId != null ? `Truck #${fallbackId}` : '—'
}

export function truckDriverLabel(
  driver?: {
    display_name?: string
    first_name?: string
    last_name?: string
    email?: string
    name?: string
  } | null,
  fallbackId?: number,
): string {
  const display = driver?.display_name?.trim() || driver?.name?.trim()
  if (display) return display
  const parts = [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim()
  if (parts) return parts
  return personName(driver, fallbackId)
}

/** @deprecated Use truckLabel */
export const vehicleLabel = truckLabel

export function orgRolePath(parts: {
  designation?: { designation_name?: string } | null
  department?: { department_name?: string } | null
  branch?: { branch_name?: string } | null
}): string {
  const segments = [
    parts.designation?.designation_name,
    parts.department?.department_name,
    parts.branch?.branch_name,
  ].filter(Boolean)
  return segments.length > 0 ? segments.join(' · ') : '—'
}
