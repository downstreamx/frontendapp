import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuantityInput, parseQuantityInput } from '@/components/ui/quantity-input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EntitySelect } from '@/components/forms/entity-select'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantityInputString } from '@/lib/format-quantity'
import {
  createDistributionResource,
  getDistributionResource,
  updateDistributionResource,
  type DistributionField,
} from '../distribution-api'
import {
  augmentLookupOptionsForRecord,
  recordToDistributionFormState,
} from '../distribution-form-utils'
import { useDistributionMeta, type DistributionLookupKey } from '../hooks/use-distribution-meta'

export type DistributionFormDialogProps = {
  title: string
  apiPath: string
  fields: DistributionField[]
  mode: 'create' | 'edit'
  recordId?: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (saved: { id: number }) => void
  /** Query-string values to prefill on create (e.g. from show-page deep links). */
  prefillParams?: Record<string, string>
  /** Default status sent on create when the form has no status field. */
  defaultCreateStatus?: string
}

const SEARCHABLE_LOOKUPS = new Set<DistributionLookupKey>([
  'depot',
  'truck_load',
  'depot_rep',
])

const EMPTY_PREFILL_PARAMS: Record<string, string> = {}

function isQuantityField(field: DistributionField): boolean {
  return field.type === 'number' && !field.lookup
}

function formatFieldValue(field: DistributionField, value: unknown): string {
  if (value == null || value === '') {
    return ''
  }
  const str = String(value)
  return isQuantityField(field) ? formatQuantityInputString(str) : str
}

export function DistributionFormDialog({
  title,
  apiPath,
  fields,
  mode,
  recordId,
  open,
  onOpenChange,
  onSuccess,
  prefillParams,
  defaultCreateStatus,
}: DistributionFormDialogProps) {
  const resolvedPrefillParams = prefillParams ?? EMPTY_PREFILL_PARAMS
  const isEdit = mode === 'edit' && recordId != null && Number.isFinite(recordId)
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { optionsFor, isLoading: metaLoading } = useDistributionMeta()

  const initialForm = useMemo(
    () =>
      Object.fromEntries(
        fields.map((f) => [f.name, f.defaultValue != null ? String(f.defaultValue) : '']),
      ),
    [fields],
  )

  const [form, setForm] = useState<Record<string, string>>(initialForm)

  const { data: record, isLoading: recordLoading } = useQuery({
    queryKey: ['distribution', apiPath, recordId],
    queryFn: () => getDistributionResource(apiPath, recordId!),
    enabled: isEdit && open,
  })

  useEffect(() => {
    if (!open) return
    if (!isEdit) {
      const prefilled: Record<string, string> = { ...initialForm }
      for (const field of fields) {
        const fromQuery = resolvedPrefillParams[field.name]
        if (fromQuery) {
          prefilled[field.name] = formatFieldValue(field, fromQuery)
        }
      }
      setForm(prefilled)
      return
    }
    if (!record) return
    const nextForm = recordToDistributionFormState(record, fields)
    setForm((prev) => {
      const unchanged = fields.every((f) => prev[f.name] === nextForm[f.name])
      return unchanged ? prev : nextForm
    })
  }, [record, isEdit, fields, initialForm, open, resolvedPrefillParams])

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      isEdit
        ? updateDistributionResource(apiPath, recordId!, body)
        : createDistributionResource(apiPath, body),
    onSuccess: (saved) => {
      toast.success(isEdit ? t('Record updated') : t('Record created'))
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
      onSuccess?.(saved)
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, isEdit ? t('Failed to update record') : t('Failed to create record')),
      ),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {}
    for (const field of fields) {
      const raw = form[field.name]
      if (raw === '' && !field.required) continue
      if (field.lookup || field.type === 'number') {
        if (isQuantityField(field)) {
          const parsed = parseQuantityInput(raw)
          if (parsed == null) continue
          body[field.name] = parsed
        } else {
          body[field.name] = Number(raw)
        }
      } else {
        body[field.name] = raw
      }
    }
    if (!isEdit && defaultCreateStatus && body.status == null) {
      body.status = defaultCreateStatus
    }
    saveMutation.mutate(body)
  }

  const dialogTitle = isEdit
    ? t('Edit {{entity}}', { entity: title.toLowerCase() })
    : t('New {{entity}}', { entity: title.toLowerCase() })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        {isEdit && (recordLoading || metaLoading) ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {fields.map((field) => {
              const lookupOptions = field.lookup
                ? augmentLookupOptionsForRecord(
                    optionsFor(field.lookup as DistributionLookupKey),
                    field,
                    isEdit ? (record as Record<string, unknown> | undefined) : undefined,
                  )
                : []

              return (
              <div key={field.name} className="space-y-1">
                {isQuantityField(field) ? (
                  <QuantityInput
                    id={field.name}
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={form[field.name] ?? ''}
                    onChange={(value) => setForm((prev) => ({ ...prev, [field.name]: value }))}
                    required={field.required}
                  />
                ) : (
                  <>
                    <Label>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </Label>
                    {field.lookup ? (
                      <EntitySelect
                        value={form[field.name] ?? ''}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
                        options={lookupOptions}
                        placeholder={metaLoading ? t('Loading…') : undefined}
                        required={field.required}
                        disabled={metaLoading}
                        searchable={
                          field.lookup === 'truck' ||
                          SEARCHABLE_LOOKUPS.has(field.lookup as DistributionLookupKey)
                        }
                        searchPlaceholder={
                          field.lookup === 'truck' ? t('Search plate number…') : undefined
                        }
                      />
                    ) : (
                      <Input
                        type={field.type ?? 'text'}
                        required={field.required}
                        value={form[field.name] ?? ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                  </>
                )}
              </div>
            )})}
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending || metaLoading}>
                {saveMutation.isPending ? t('Saving…') : t('Save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
