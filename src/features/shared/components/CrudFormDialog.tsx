import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Checkbox } from '@/components/ui/checkbox'

export type CrudFieldDef = {
  name: string
  label: string
  type?: 'text' | 'color' | 'number' | 'textarea' | 'richtext' | 'select' | 'time' | 'date' | 'checkbox'
  description?: string
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string } | { id: number; label: string }>
  min?: number | string
  max?: number | string
  step?: number | string
}

type Props = {
  open: boolean
  mode: 'add' | 'edit'
  title: string
  fields: CrudFieldDef[]
  initialValues?: Record<string, unknown>
  defaultFieldValues?: Record<string, string>
  isPending?: boolean
  submitLabel?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
}

export function CrudFormDialog({
  open,
  mode,
  title,
  fields,
  initialValues,
  defaultFieldValues,
  isPending,
  submitLabel,
  onOpenChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const next: Record<string, string> = {}
    for (const field of fields) {
      const raw = initialValues?.[field.name]
      const fallback = defaultFieldValues?.[field.name]
      if (field.type === 'checkbox') {
        const checked = raw === true || raw === 'true' || raw === 1 || raw === '1'
        next[field.name] = checked ? 'true' : (fallback ?? 'false')
        continue
      }
      next[field.name] = raw != null && raw !== '' ? String(raw) : (fallback ?? '')
    }
    setValues(next)
  }, [open, fields, initialValues, defaultFieldValues])

  const setField = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.name] ?? ''
      if (field.type === 'number') {
        payload[field.name] = value === '' ? undefined : Number(value)
      } else if (field.type === 'checkbox') {
        payload[field.name] = value === 'true'
      } else {
        payload[field.name] = value
      }
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              {field.type !== 'checkbox' ? (
                <Label htmlFor={field.name}>{field.label}</Label>
              ) : null}
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === 'richtext' ? (
                <RichTextEditor
                  content={values[field.name] ?? ''}
                  onChange={(html) => setField(field.name, html)}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={values[field.name] ?? ''}
                  onValueChange={(v) => setField(field.name, v)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => {
                      const value = 'value' in opt ? opt.value : String(opt.id)
                      return (
                        <SelectItem key={value} value={value}>
                          {opt.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : field.type === 'time' ? (
                <Input
                  id={field.name}
                  type="time"
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required={field.required}
                />
              ) : field.type === 'date' ? (
                <Input
                  id={field.name}
                  type="date"
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required={field.required}
                />
              ) : field.type === 'color' ? (
                <Input
                  id={field.name}
                  type="color"
                  value={values[field.name] || '#FF6B6B'}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="h-10 w-20"
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id={field.name}
                    checked={values[field.name] === 'true'}
                    onCheckedChange={(checked) => setField(field.name, checked === true ? 'true' : 'false')}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={field.name} className="cursor-pointer font-normal">
                      {field.label}
                    </Label>
                    {field.description ? (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {submitLabel ??
                (isPending
                  ? mode === 'add'
                    ? t('Creating...')
                    : t('Saving...')
                  : mode === 'add'
                    ? t('Create')
                    : t('Save'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
