import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { formatCurrency, formatDate } from '@/utils/helpers'

const schema = z.object({
  entry_date: z.string().min(1),
  category_id: z.string().min(1),
  bank_account_id: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type FinanceRow = {
  id: number
  revenue_date?: string
  expense_date?: string
  revenue_number?: string
  expense_number?: string
  amount: number | string
  status: string
  description?: string | null
}

type Props = {
  kind: 'revenue' | 'expense'
  listFn: (params?: Record<string, string>) => Promise<FinanceRow[]>
  metaFn: () => Promise<{
    categories: Array<{ id: number; category_name: string }>
    bank_accounts: Array<{ id: number; account_name: string }>
  }>
  createFn: (input: {
    revenue_date?: string
    expense_date?: string
    category_id: number
    bank_account_id: number
    amount: number
    description?: string
  }) => Promise<unknown>
  approveFn: (id: number) => Promise<unknown>
  postFn: (id: number) => Promise<unknown>
}

export function FinanceEntriesIndexPage({
  kind,
  listFn,
  metaFn,
  createFn,
  approveFn,
  postFn,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const isRevenue = kind === 'revenue'
  const title = isRevenue ? t('Revenues') : t('Expenses')
  const queryKey = isRevenue ? 'revenues' : 'expenses'

  useAccountPageChrome(title, title)

  const listQuery = useQuery({ queryKey: [queryKey], queryFn: () => listFn() })
  const metaQuery = useQuery({ queryKey: [queryKey, 'create-meta'], queryFn: metaFn })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      category_id: '',
      bank_account_id: '',
      amount: 0,
      description: '',
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] })
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
  }

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createFn({
        ...(isRevenue
          ? { revenue_date: values.entry_date }
          : { expense_date: values.entry_date }),
        category_id: Number(values.category_id),
        bank_account_id: Number(values.bank_account_id),
        amount: values.amount,
        description: values.description,
      }),
    onSuccess: () => {
      toast.success(isRevenue ? t('Revenue recorded') : t('Expense recorded'))
      invalidate()
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error(isRevenue ? t('Failed to create revenue') : t('Failed to create expense')),
  })

  const approveMutation = useMutation({
    mutationFn: approveFn,
    onSuccess: () => {
      toast.success(isRevenue ? t('Revenue approved') : t('Expense approved'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to approve')),
  })

  const postMutation = useMutation({
    mutationFn: postFn,
    onSuccess: () => {
      toast.success(isRevenue ? t('Revenue posted to ledger') : t('Expense posted to ledger'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to post')),
  })

  const dateField = isRevenue ? 'revenue_date' : 'expense_date'
  const numberField = isRevenue ? 'revenue_number' : 'expense_number'

  const columns: Column<FinanceRow>[] = [
    {
      key: 'number',
      header: t('Number'),
      render: (_, row) => row[numberField as keyof FinanceRow] ?? `#${row.id}`,
    },
    {
      key: 'date',
      header: t('Date'),
      render: (_, row) => {
        const d = row[dateField as keyof FinanceRow] as string | undefined
        return d ? formatDate(d) : '—'
      },
    },
    {
      key: 'amount',
      header: t('Amount'),
      render: (_, row) => formatCurrency(Number(row.amount)),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate(row.id)}
            >
              {t('Approve')}
            </Button>
          )}
          {row.status === 'approved' && (
            <Button
              size="sm"
              variant="outline"
              disabled={postMutation.isPending}
              onClick={() => postMutation.mutate(row.id)}
            >
              {t('Post')}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={title}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={listQuery.isLoading}
        error={!!listQuery.error}
      >
        <DataTable
          data={listQuery.data ?? []}
          columns={columns}
          className="rounded-none border-0 shadow-none"
          emptyState={
            <NoRecordsFound
              icon={Receipt}
              title={isRevenue ? t('No revenues yet') : t('No expenses yet')}
              onCreateClick={() => setOpen(true)}
              createButtonText={t('Create')}
              className="h-auto py-8"
            />
          }
        />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRevenue ? t('New revenue') : t('New expense')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>{t('Date')}</Label>
              <Input type="date" {...form.register('entry_date')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Category')}</Label>
              <Select
                value={form.watch('category_id')}
                onValueChange={(v) => form.setValue('category_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select category')} />
                </SelectTrigger>
                <SelectContent>
                  {(metaQuery.data?.categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Bank account')}</Label>
              <Select
                value={form.watch('bank_account_id')}
                onValueChange={(v) => form.setValue('bank_account_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select bank account')} />
                </SelectTrigger>
                <SelectContent>
                  {(metaQuery.data?.bank_accounts ?? []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Amount')}</Label>
              <Input type="number" step="0.01" {...form.register('amount')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
