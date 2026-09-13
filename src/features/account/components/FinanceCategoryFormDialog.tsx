import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { getApiErrorMessage } from '@/lib/errors'
import {
  createFinanceCategory,
  getFinanceCategoryCreateMeta,
  updateFinanceCategory,
  type FinanceCategory,
  type FinanceCategoryKind,
} from '../finance-categories-api'

const schema = z.object({
  category_name: z.string().min(1),
  category_code: z.string().min(1),
  gl_account_id: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  kind: FinanceCategoryKind
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  category?: FinanceCategory | null
  onSuccess: () => void
}

function toFormValues(category?: FinanceCategory | null): FormValues {
  return {
    category_name: category?.category_name ?? '',
    category_code: category?.category_code ?? '',
    gl_account_id: category?.gl_account_id ? String(category.gl_account_id) : '',
    description: category?.description ?? '',
    is_active: category?.is_active ?? true,
  }
}

function toPayload(values: FormValues) {
  return {
    category_name: values.category_name,
    category_code: values.category_code,
    gl_account_id:
      values.gl_account_id && values.gl_account_id !== 'none'
        ? Number(values.gl_account_id)
        : null,
    description: values.description || undefined,
    is_active: values.is_active,
  }
}

export function FinanceCategoryFormDialog({
  kind,
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'
  const isRevenue = kind === 'revenue'

  const metaQuery = useQuery({
    queryKey: [kind, 'categories', 'create-meta'],
    queryFn: () => getFinanceCategoryCreateMeta(kind),
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(isEdit ? category : null))
    }
  }, [open, category, isEdit, form])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(values)
      return isEdit && category
        ? updateFinanceCategory(kind, category.id, payload)
        : createFinanceCategory(kind, payload)
    },
    onSuccess: () => {
      toast.success(
        isRevenue
          ? isEdit
            ? t('The revenue categories has been updated successfully.')
            : t('The revenue categories has been created successfully.')
          : isEdit
            ? t('The expense categories has been updated successfully.')
            : t('The expense categories has been created successfully.'),
      )
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? t('Failed to update category') : t('Failed to create category'),
        ),
      ),
  })

  const chartOfAccounts = metaQuery.data?.chart_of_accounts ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRevenue
              ? isEdit
                ? t('Edit Revenue Categories')
                : t('Create Revenue Categories')
              : isEdit
                ? t('Edit Expense Categories')
                : t('Create Expense Categories')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="category_name">{t('Category Name')}</Label>
            <Input id="category_name" {...form.register('category_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_code">{t('Category Code')}</Label>
            <Input id="category_code" {...form.register('category_code')} />
          </div>
          <div className="space-y-2">
            <Label>{t('GL Account')}</Label>
            <Select
              value={form.watch('gl_account_id') || 'none'}
              onValueChange={(value) =>
                form.setValue('gl_account_id', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Gl Account')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('None')}</SelectItem>
                {chartOfAccounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.account_code} — {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="is_active">{t('Is Active')}</Label>
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? isEdit
                  ? t('Updating...')
                  : t('Creating...')
                : isEdit
                  ? t('Update')
                  : t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
