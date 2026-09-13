import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'

type EmptyHint = {
  message: string
  setupPath: string
  setupLabel: string
}

type Props = {
  id?: string
  value: string
  options: SetupPaymentTermOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Shown when there are no setup terms (free-text fallback). */
  emptyHint?: EmptyHint
}

export function PaymentTermsSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  emptyHint,
}: Props) {
  const { t } = useTranslation()

  const optionNames = useMemo(() => new Set(options.map((option) => option.name)), [options])
  const hasLegacyValue = Boolean(value) && !optionNames.has(value)

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t('e.g., Net 30')}
          disabled={disabled}
        />
        {emptyHint ? (
          <p className="text-xs text-muted-foreground">
            {emptyHint.message}{' '}
            <Link to={emptyHint.setupPath} className="text-primary underline hover:no-underline">
              {emptyHint.setupLabel}
            </Link>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder ?? t('Select payment terms')} />
      </SelectTrigger>
      <SelectContent>
        {hasLegacyValue ? (
          <SelectItem value={value}>{value}</SelectItem>
        ) : null}
        {options.map((option) => {
          const label = option.code ? `${option.name} (${option.code})` : option.name
          const creditSuffix = option.is_credit
            ? ` — ${t('Credit', { defaultValue: 'Credit' })}`
            : ''
          return (
            <SelectItem key={option.id} value={option.name}>
              {label}
              {creditSuffix}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
