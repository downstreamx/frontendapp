/**
 * Petroleum / product quantity display and input parsing.
 *
 * Table columns: `render: (value) => formatQuantity(value)` or `formatQuantity(value, { unit: 'L' })`.
 * Forms: pair {@link QuantityInput} with `parseQuantityInput` on submit.
 */
export type FormatQuantityOptions = {
  unit?: string | null
  maximumFractionDigits?: number
  empty?: string
}

export function formatQuantity(
  value: number | string | null | undefined,
  options?: FormatQuantityOptions,
): string {
  const empty = options?.empty ?? '—'
  const n = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) {
    return empty
  }

  const maxFrac = options?.maximumFractionDigits ?? 2
  const formatted = Number.isInteger(n)
    ? n.toLocaleString()
    : n.toLocaleString(undefined, { maximumFractionDigits: maxFrac })

  const unit = options?.unit?.trim()
  return unit ? `${formatted} ${unit}` : formatted
}

/** Strip grouping separators and parse a numeric quantity from user input. */
export function parseQuantityInput(display: string): number | null {
  const cleaned = display.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Format a raw string for controlled quantity inputs (thousand separators, single decimal). */
export function formatQuantityInputString(raw: string): string {
  const normalized = raw.replace(/,/g, '')
  if (normalized === '') return ''

  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const parts = unsigned.split('.')
  if (parts.length > 2) {
    return formatQuantityInputString(`${negative ? '-' : ''}${parts[0]}.${parts.slice(1).join('')}`)
  }

  const intPart = parts[0].replace(/\D/g, '')
  const decPart = parts[1] != null ? parts[1].replace(/\D/g, '') : undefined
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = decPart !== undefined ? `${grouped}.${decPart}` : grouped
  return negative ? `-${body}` : body
}
