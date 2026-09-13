import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.message) return data.message
    const first = data?.errors && Object.values(data.errors)[0]?.[0]
    if (first) return first
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Map Laravel 422 validation errors to a single message per field. */
export function mapApiValidationErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) {
    return {}
  }

  const data = error.response?.data as { errors?: Record<string, string[]> } | undefined
  if (!data?.errors) {
    return {}
  }

  const mapped: Record<string, string> = {}
  for (const [field, messages] of Object.entries(data.errors)) {
    if (messages[0]) {
      mapped[field] = messages[0]
    }
  }

  return mapped
}
