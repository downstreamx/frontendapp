import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SetupCategoryOption } from '@/lib/setup-lookup-types'

type Props = {
  id?: string
  value: string
  options: SetupCategoryOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CategorySelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const { t } = useTranslation()

  if (options.length === 0) {
    return null
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(next) => onChange(next === 'none' ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder ?? t('Select category')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('None')}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.code ? `${option.name} (${option.code})` : option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
