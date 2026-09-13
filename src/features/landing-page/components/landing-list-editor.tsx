import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaPicker } from '@/features/media/components/MediaPicker'

export type LandingListField = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'image'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

type ListItem = { id: string; [key: string]: string }

type Props = {
  fields: LandingListField[]
  value: ListItem[]
  onChange: (items: ListItem[]) => void
  addButtonText?: string
  minItems?: number
}

function newId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyItem(fields: LandingListField[]): ListItem {
  const item: ListItem = { id: newId() }
  for (const field of fields) {
    item[field.name] = ''
  }
  return item
}

export function LandingListEditor({
  fields,
  value,
  onChange,
  addButtonText,
  minItems = 0,
}: Props) {
  const { t } = useTranslation()

  const items = value.length > 0 ? value : minItems > 0 ? [emptyItem(fields)] : []

  const updateItem = (id: string, name: string, fieldValue: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [name]: fieldValue } : item)))
  }

  const addItem = () => {
    onChange([...items, emptyItem(fields)])
  }

  const removeItem = (id: string) => {
    if (items.length <= minItems) return
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              #{index + 1}
            </span>
            {items.length > minItems && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                aria-label={t('Remove')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.type === 'textarea' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}
              >
                <Label>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={item[field.name] ?? ''}
                    onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={item[field.name] ?? ''}
                    onValueChange={(v) => updateItem(item.id, field.name, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'image' ? (
                  <MediaPicker
                    value={item[field.name] ?? ''}
                    onChange={(v) =>
                      updateItem(item.id, field.name, typeof v === 'string' ? v : v[0] ?? '')
                    }
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Input
                    value={item[field.name] ?? ''}
                    onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        {addButtonText ?? t('Add item')}
      </Button>
    </div>
  )
}
