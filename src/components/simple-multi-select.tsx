import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'

type Option = { value: string; label: string }

type SimpleMultiSelectProps = {
  options: Option[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

/** Thin adapter used by repeater and legacy CRUD fields. */
export function SimpleMultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: SimpleMultiSelectProps) {
  return (
    <MultiSelectEnhanced
      options={options}
      value={selected}
      onValueChange={onChange}
      placeholder={placeholder}
      searchable
    />
  )
}
