import { useEffect, useMemo } from 'react'
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
import { formatCurrency } from '@/utils/helpers'
import {
  createBankTransfer,
  getBankTransferCreateMeta,
  updateBankTransfer,
  type BankTransfer,
  type BankTransferInput,
} from '../bank-transfers-api'

const schema = z
  .object({
    transfer_date: z.string().min(1),
    from_account_id: z.string().min(1),
    to_account_id: z.string().min(1),
    transfer_amount: z.coerce.number().min(0.01),
    transfer_charges: z.coerce.number().min(0).optional(),
    reference_number: z.string().optional(),
    description: z.string().min(1).max(500),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'Destination account must be different from source account.',
    path: ['to_account_id'],
  })

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  transfer?: BankTransfer | null
  onSuccess: () => void
}

function toFormValues(transfer?: BankTransfer | null): FormValues {
  return {
    transfer_date: transfer?.transfer_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    from_account_id: transfer?.from_account_id ? String(transfer.from_account_id) : '',
    to_account_id: transfer?.to_account_id ? String(transfer.to_account_id) : '',
    transfer_amount: Number(transfer?.transfer_amount ?? 0),
    transfer_charges: Number(transfer?.transfer_charges ?? 0),
    reference_number: transfer?.reference_number ?? '',
    description: transfer?.description ?? '',
  }
}

function toPayload(values: FormValues): BankTransferInput {
  return {
    transfer_date: values.transfer_date,
    from_account_id: Number(values.from_account_id),
    to_account_id: Number(values.to_account_id),
    transfer_amount: values.transfer_amount,
    transfer_charges: values.transfer_charges ?? 0,
    reference_number: values.reference_number || undefined,
    description: values.description,
  }
}

export function BankTransferFormDialog({
  open,
  onOpenChange,
  mode,
  transfer,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'

  const metaQuery = useQuery({
    queryKey: ['bank-transfers', 'create-meta'],
    queryFn: getBankTransferCreateMeta,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(transfer),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(transfer))
    }
  }, [open, transfer, form])

  const fromAccountId = form.watch('from_account_id')
  const bankAccounts = metaQuery.data?.bank_accounts ?? []

  const destinationAccounts = useMemo(
    () => bankAccounts.filter((b) => String(b.id) !== fromAccountId),
    [bankAccounts, fromAccountId],
  )

  const selectedFrom = bankAccounts.find((b) => String(b.id) === fromAccountId)

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(values)
      return isEdit && transfer
        ? updateBankTransfer(transfer.id, payload)
        : createBankTransfer(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The bank transfer has been updated successfully.')
          : t('The bank transfer has been created successfully.'),
      )
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? t('Failed to update bank transfer') : t('Failed to create bank transfer'),
        ),
      ),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit Bank Transfer') : t('Create Bank Transfer')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="transfer_date">{t('Transfer Date')}</Label>
            <Input id="transfer_date" type="date" {...form.register('transfer_date')} />
          </div>

          <div className="space-y-2">
            <Label>{t('From Account')}</Label>
            <Select
              value={fromAccountId}
              onValueChange={(value) => {
                form.setValue('from_account_id', value)
                if (form.getValues('to_account_id') === value) {
                  form.setValue('to_account_id', '')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select source account')} />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.account_name}
                    {b.account_number ? ` (${b.account_number})` : ''}
                    {b.current_balance != null
                      ? ` — ${formatCurrency(Number(b.current_balance))}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFrom?.current_balance != null ? (
              <p className="text-xs text-muted-foreground">
                {t('Available balance')}: {formatCurrency(Number(selectedFrom.current_balance))}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('To Account')}</Label>
            <Select
              value={form.watch('to_account_id')}
              onValueChange={(value) => form.setValue('to_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select destination account')} />
              </SelectTrigger>
              <SelectContent>
                {destinationAccounts.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.account_name}
                    {b.account_number ? ` (${b.account_number})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.to_account_id ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.to_account_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer_amount">{t('Transfer Amount')}</Label>
              <Input
                id="transfer_amount"
                type="number"
                step="0.01"
                {...form.register('transfer_amount')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer_charges">{t('Transfer Charges')}</Label>
              <Input
                id="transfer_charges"
                type="number"
                step="0.01"
                {...form.register('transfer_charges')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">{t('Reference Number')}</Label>
            <Input id="reference_number" {...form.register('reference_number')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
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
