import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  type SelectContentProps,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { lookupOptionValue, type LookupOption } from '@/features/_shared/operations-lookups'
import { LookupOptionLabel } from './lookup-option-media'

const SEARCHABLE_MEDIA_KINDS = new Set(['customer', 'supplier', 'truck', 'driver'])

type Props = {
  value: string
  onValueChange: (value: string) => void
  options: LookupOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  emptyMessage?: string
  /** When omitted, search is enabled for customer/supplier/truck/driver option lists. */
  searchable?: boolean
  searchPlaceholder?: string
}

export function lookupOptionsAreSearchable(options: LookupOption[]): boolean {
  return options.some(
    (option) => option.mediaKind != null && SEARCHABLE_MEDIA_KINDS.has(option.mediaKind),
  )
}

export function filterLookupOptions(options: LookupOption[], query: string): LookupOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options
  return options.filter((option) => option.label.toLowerCase().includes(normalized))
}

function findOption(options: LookupOption[], value: string): LookupOption | undefined {
  if (!value) return undefined
  return options.find((opt) => lookupOptionValue(opt) === value)
}

export function LookupSelectItems({
  options,
  leadingItem,
}: {
  options: LookupOption[]
  leadingItem?: ReactNode
}) {
  return (
    <>
      {leadingItem}
      {options.map((opt) => {
        const optionValue = lookupOptionValue(opt)
        return (
          <SelectItem
            key={`${optionValue}-${opt.label}`}
            value={optionValue}
            textValue={opt.label}
            className="py-2 pl-9"
          >
            <LookupOptionLabel option={opt} />
          </SelectItem>
        )
      })}
    </>
  )
}

type LookupSelectContentProps = Omit<SelectContentProps, 'searchable' | 'search' | 'onSearchChange'> & {
  options: LookupOption[]
  leadingItem?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
}

/** Searchable dropdown panel for filter selects using {@link LookupSelectItems}. */
export function LookupSelectContent({
  options,
  leadingItem,
  searchable,
  searchPlaceholder,
  ...contentProps
}: LookupSelectContentProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const resolvedSearchable = searchable ?? lookupOptionsAreSearchable(options)
  const filteredOptions = useMemo(
    () => (resolvedSearchable ? filterLookupOptions(options, search) : options),
    [options, resolvedSearchable, search],
  )

  return (
    <SelectContent
      {...contentProps}
      searchable={resolvedSearchable}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder ?? t('Search...')}
    >
      {filteredOptions.length === 0 && !leadingItem ? (
        <SelectItem value="__empty" disabled>
          {t('No matches found')}
        </SelectItem>
      ) : (
        <LookupSelectItems options={filteredOptions} leadingItem={leadingItem} />
      )}
    </SelectContent>
  )
}

export function EntitySelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  required,
  disabled,
  emptyMessage = 'No options available',
  searchable,
  searchPlaceholder,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const resolvedSearchable = searchable ?? lookupOptionsAreSearchable(options)
  const filteredOptions = useMemo(
    () => (resolvedSearchable ? filterLookupOptions(options, search) : options),
    [options, resolvedSearchable, search],
  )
  const selected = findOption(options, value)

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      required={required}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) setSearch('')
      }}
    >
      <SelectTrigger>
        {selected?.image || selected?.mediaKind ? (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <LookupOptionLabel option={selected} />
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent
        searchable={resolvedSearchable}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder ?? t('Search...')}
      >
        {filteredOptions.length === 0 ? (
          <SelectItem value="__empty" disabled>
            {search.trim() ? t('No matches found') : emptyMessage}
          </SelectItem>
        ) : (
          <LookupSelectItems options={filteredOptions} />
        )}
      </SelectContent>
    </Select>
  )
}
