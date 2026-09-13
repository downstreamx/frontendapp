import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import type { PerPageOption } from './per-page-types'

export type { PerPageOption } from './per-page-types'

type PerPageSelectorProps = {
  value: string
  onChange: (value: string) => void
  options?: PerPageOption[]
  className?: string
}

/** SPA-controlled per-page selector (legacy toolbar control). */
export function PerPageSelector({
  value,
  onChange,
  options,
  className = 'w-32',
}: PerPageSelectorProps) {
  const { t } = useTranslation()

  const resolvedOptions = useMemo<PerPageOption[]>(
    () =>
      options ?? [
        { value: '10', label: t('10 per page') },
        { value: '15', label: t('15 per page') },
        { value: '25', label: t('25 per page') },
        { value: '50', label: t('50 per page') },
        { value: '100', label: t('100 per page') },
      ],
    [options, t],
  )

  const resolvedValue = resolvedOptions.some((option) => option.value === value)
    ? value
    : (resolvedOptions[0]?.value ?? '10')

  return (
    <Select value={resolvedValue} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {resolvedOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
