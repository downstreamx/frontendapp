import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { LookupOptionMedia } from '@/components/forms/lookup-option-media'
import { cn } from '@/lib/utils'

export type TruckMultiSelectItem = {
  id: number
  label: string
  sublabel?: string
  capacityLitres?: number
  image?: string | null
  mediaKind?: 'truck'
}

type Props = {
  items: TruckMultiSelectItem[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  quantities?: Record<number, string>
  onQuantityChange?: (id: number, value: string) => void
  emptyMessage?: string
  className?: string
}

export function TruckMultiSelectList({
  items,
  selectedIds,
  onSelectionChange,
  quantities,
  onQuantityChange,
  emptyMessage,
  className,
}: Props) {
  const showQuantities = quantities != null && onQuantityChange != null

  const toggle = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
      return
    }
    onSelectionChange(selectedIds.filter((x) => x !== id))
  }

  if (items.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : null
  }

  return (
    <div
      className={cn(
        'max-h-64 space-y-1 overflow-y-auto rounded-md border p-2',
        className,
      )}
    >
      {items.map((item) => {
        const checked = selectedIds.includes(item.id)
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50',
              checked && 'bg-muted/30',
            )}
          >
            <Checkbox
              id={`truck-select-${item.id}`}
              checked={checked}
              onCheckedChange={(value) => toggle(item.id, value === true)}
              className="mt-1"
            />
            <label
              htmlFor={`truck-select-${item.id}`}
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5"
            >
              <span className="flex items-center gap-2">
                <LookupOptionMedia
                  image={item.image}
                  mediaKind={item.mediaKind ?? 'truck'}
                  className="h-7 w-7"
                  alt={item.label}
                />
                <span className="truncate text-sm font-medium">{item.label}</span>
              </span>
              {item.sublabel ? (
                <span className="text-xs text-muted-foreground">{item.sublabel}</span>
              ) : null}
            </label>
            {showQuantities && checked ? (
              <div className="w-28 shrink-0">
                <Input
                  type="text"
                  inputMode="decimal"
                  className="h-8 text-right text-sm"
                  value={quantities[item.id] ?? ''}
                  onChange={(e) => onQuantityChange(item.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Quantity for ${item.label}`}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
