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
import { CurrencyInput } from '@/components/ui/currency-input'
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
  createRevenue,
  getRevenueCreateMeta,
  updateRevenue,
  type Revenue,
} from '../revenues-api'

const schema = z.object({
  revenue_date: z.string().min(1),
  category_id: z.string().min(1),
  bank_account_id: z.string().min(1),
  chart_of_account_id: z.string().optional(),
  amount: z.string().min(1),
  description: z.string().optional(),
  reference_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  revenue?: Revenue | null
  onSuccess: () => void
}

function toFormValues(revenue?: Revenue | null): FormValues {
  return {
    revenue_date: revenue?.revenue_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    category_id: revenue?.category_id ? String(revenue.category_id) : '',
    bank_account_id: revenue?.bank_account_id ? String(revenue.bank_account_id) : '',
    chart_of_account_id: revenue?.chart_of_account_id ? String(revenue.chart_of_account_id) : '',
    amount: revenue?.amount != null ? String(revenue.amount) : '',
    description: revenue?.description ?? '',
    reference_number: revenue?.reference_number ?? '',
  }
}

function parseAmount(value: string): number {
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function toPayload(values: FormValues) {
  return {
    revenue_date: values.revenue_date,
    category_id: Number(values.category_id),
    bank_account_id: Number(values.bank_account_id),
    chart_of_account_id:
      values.chart_of_account_id && values.chart_of_account_id !== 'none'
        ? Number(values.chart_of_account_id)
        : null,
    amount: parseAmount(values.amount),
    description: values.description || undefined,
    reference_number: values.reference_number || undefined,
  }
}

export function RevenueFormDialog({ open, onOpenChange, mode, revenue, onSuccess }: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'

  const metaQuery = useQuery({
    queryKey: ['revenues', 'create-meta'],
    queryFn: getRevenueCreateMeta,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(isEdit ? revenue : null))
    }
  }, [open, revenue, isEdit, form])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(values)
      return isEdit && revenue ? updateRevenue(revenue.id, payload) : createRevenue(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The revenue details are updated successfully.')
          : t('The revenue has been created successfully.'),
      )
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, isEdit ? t('Failed to update revenue') : t('Failed to create revenue')),
      ),
  })

  const categories = metaQuery.data?.categories ?? []
  const bankAccounts = metaQuery.data?.bank_accounts ?? []
  const chartOfAccounts = metaQuery.data?.chart_of_accounts ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('Edit Revenue') : t('Create Revenue')}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revenue_date">{t('Revenue Date')}</Label>
              <Input id="revenue_date" type="date" {...form.register('revenue_date')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Category')}</Label>
              <Select
                value={form.watch('category_id')}
                onValueChange={(value) => form.setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Bank Account')}</Label>
              <Select
                value={form.watch('bank_account_id')}
                onValueChange={(value) => form.setValue('bank_account_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Bank Account')} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Chart of Account')}</Label>
              <Select
                value={form.watch('chart_of_account_id') || 'none'}
                onValueChange={(value) =>
                  form.setValue('chart_of_account_id', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Chart of Account')} />
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
          </div>

          <CurrencyInput
            label={t('Amount')}
            value={form.watch('amount')}
            onChange={(value) => form.setValue('amount', value)}
            error={form.formState.errors.amount?.message}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="reference_number">{t('Reference Number')}</Label>
            <Input id="reference_number" {...form.register('reference_number')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
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
