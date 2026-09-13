import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/** Typed zodResolver for Zod 4 + react-hook-form (avoids coerce `unknown` inference). */
export function createZodResolver<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues, FieldValues>,
): Resolver<TFieldValues> {
  return zodResolver(schema) as Resolver<TFieldValues>
}
