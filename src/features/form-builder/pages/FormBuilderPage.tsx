import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { paths } from '@/lib/paths'
import {
  createFormField,
  deleteFormField,
  FORM_FIELD_TYPES,
  listFormFields,
} from '../form-builder-api'

export function FormBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [type, setType] = useState<string>('text')
  const [placeholder, setPlaceholder] = useState('')
  const [required, setRequired] = useState(false)

  const fieldsQuery = useQuery({
    queryKey: ['form-builder', 'fields', id],
    queryFn: () => listFormFields(id!),
    enabled: Boolean(id),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createFormField(id!, {
        label,
        type,
        placeholder: placeholder || undefined,
        required,
      }),
    onSuccess: () => {
      toast.success('Field added')
      queryClient.invalidateQueries({ queryKey: ['form-builder', 'fields', id] })
      setLabel('')
      setPlaceholder('')
      setRequired(false)
    },
    onError: () => toast.error('Failed to add field'),
  })

  const deleteMutation = useMutation({
    mutationFn: (fieldId: number) => deleteFormField(id!, fieldId),
    onSuccess: () => {
      toast.success('Field removed')
      queryClient.invalidateQueries({ queryKey: ['form-builder', 'fields', id] })
    },
    onError: () => toast.error('Failed to remove field'),
  })

  const typeOptions = FORM_FIELD_TYPES.map((t) => ({ value: t, label: t }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Form fields</CardTitle>
        <Link to={paths.formBuilderForms} className="text-sm text-primary hover:underline">
          Back to forms
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="divide-y rounded-md border text-sm">
          {(fieldsQuery.data ?? []).map((field) => (
            <li key={field.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span>
                {field.label} <span className="text-muted-foreground">({field.type})</span>
                {field.required ? ' · required' : ''}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(field.id)}
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            </li>
          ))}
          {(fieldsQuery.data ?? []).length === 0 && (
            <li className="px-3 py-4 text-muted-foreground">No fields yet</li>
          )}
        </ul>

        <form
          className="space-y-3 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (label.trim()) createMutation.mutate()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <EntitySelect value={type} onValueChange={setType} options={typeOptions} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Placeholder</Label>
              <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required field
            </label>
          </div>
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            Add field
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
