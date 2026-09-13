import { useEffect, useState } from 'react'
import { Input } from './input'
import { Label } from './label'
import InputError from './input-error'
import { formatQuantityInputString, parseQuantityInput } from '@/lib/format-quantity'

type QuantityInputProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  onValueChange?: (numeric: number | null) => void
  placeholder?: string
  error?: string
  className?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

export function QuantityInput({
  label,
  value,
  onChange,
  onValueChange,
  placeholder = '0',
  error,
  className,
  id,
  required,
  disabled,
}: QuantityInputProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatQuantityInputString(e.target.value)
    setDisplayValue(formatted)
    onChange(formatted)
    onValueChange?.(parseQuantityInput(formatted))
  }

  return (
    <div>
      {label ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`tabular-nums ${className ?? ''}`}
        required={required}
        disabled={disabled}
      />
      <InputError message={error} />
    </div>
  )
}

export { parseQuantityInput }
