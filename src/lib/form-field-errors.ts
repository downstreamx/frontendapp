import type { FieldErrors, FieldValues } from 'react-hook-form'

function messageFromFieldError(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  if ('message' in error && error.message) return String(error.message)
  return undefined
}

/** Walk nested react-hook-form / Zod errors and return the first human-readable message. */
export function getFirstFieldErrorMessage<T extends FieldValues>(
  errors: FieldErrors<T>,
): string | undefined {
  for (const value of Object.values(errors)) {
    const direct = messageFromFieldError(value)
    if (direct) return direct

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = getFirstFieldErrorMessage(item as FieldErrors<T>)
        if (nested) return nested
      }
      continue
    }

    if (value && typeof value === 'object') {
      const nested = getFirstFieldErrorMessage(value as FieldErrors<T>)
      if (nested) return nested
    }
  }
  return undefined
}
