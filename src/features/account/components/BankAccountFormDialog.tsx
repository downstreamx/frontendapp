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
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  createBankAccount,
  getBankAccountCreateMeta,
  updateBankAccount,
  type BankAccount,
  type BankAccountInput,
} from '../bank-accounts-api'
import { BANK_ACCOUNT_TYPE_OPTIONS } from '../bank-account-utils'

const schema = z.object({
  account_number: z.string().min(1),
  account_name: z.string().min(1),
  bank_name: z.string().min(1),
  branch_name: z.string().optional(),
  account_type: z.string().min(1),
  payment_gateway: z.string().optional(),
  opening_balance: z.coerce.number().min(0),
  current_balance: z.coerce.number().min(0),
  iban: z.string().optional(),
  swift_code: z.string().optional(),
  routing_number: z.string().optional(),
  is_active: z.boolean(),
  gl_account_id: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  account?: BankAccount | null
  onSuccess: () => void
}

function toFormValues(account?: BankAccount | null): FormValues {
  return {
    account_number: account?.account_number ?? '',
    account_name: account?.account_name ?? '',
    bank_name: account?.bank_name ?? '',
    branch_name: account?.branch_name ?? '',
    account_type: account?.account_type?.toString() ?? '0',
    payment_gateway: account?.payment_gateway ?? '',
    opening_balance: Number(account?.opening_balance ?? 0),
    current_balance: Number(account?.current_balance ?? 0),
    iban: account?.iban ?? '',
    swift_code: account?.swift_code ?? '',
    routing_number: account?.routing_number ?? '',
    is_active: account?.is_active ?? true,
    gl_account_id: account?.gl_account_id ? String(account.gl_account_id) : '',
  }
}

function toPayload(values: FormValues): BankAccountInput {
  return {
    account_number: values.account_number,
    account_name: values.account_name,
    bank_name: values.bank_name,
    branch_name: values.branch_name || undefined,
    account_type: values.account_type,
    payment_gateway: values.payment_gateway || undefined,
    opening_balance: values.opening_balance,
    current_balance: values.current_balance,
    iban: values.iban || undefined,
    swift_code: values.swift_code || undefined,
    routing_number: values.routing_number || undefined,
    is_active: values.is_active,
    gl_account_id: Number(values.gl_account_id),
  }
}

export function BankAccountFormDialog({
  open,
  onOpenChange,
  mode,
  account,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'

  const metaQuery = useQuery({
    queryKey: ['bank-accounts', 'create-meta'],
    queryFn: getBankAccountCreateMeta,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(account),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(account))
    }
  }, [open, account, form])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(values)
      return isEdit && account
        ? updateBankAccount(account.id, payload)
        : createBankAccount(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The bank account details are updated successfully.')
          : t('The bank account has been created successfully.'),
      )
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? t('Failed to update bank account') : t('Failed to create bank account'),
        ),
      ),
  })

  const accountTypes = metaQuery.data?.account_types?.length
    ? metaQuery.data.account_types
    : BANK_ACCOUNT_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.labelKey }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit Bank Account') : t('Create Bank Account')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="account_number">{t('Account Number')}</Label>
            <Input id="account_number" {...form.register('account_number')} />
            {form.formState.errors.account_number ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_number.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">{t('Account Name')}</Label>
            <Input id="account_name" {...form.register('account_name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">{t('Bank Name')}</Label>
            <Input id="bank_name" {...form.register('bank_name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch_name">{t('Branch Name')}</Label>
            <Input id="branch_name" {...form.register('branch_name')} />
          </div>

          <div className="space-y-2">
            <Label>{t('Account Type')}</Label>
            <RadioGroup
              value={form.watch('account_type')}
              onValueChange={(value) => form.setValue('account_type', value)}
              className="flex flex-wrap gap-4"
            >
              {accountTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={`account_type_${type.value}`} />
                  <Label htmlFor={`account_type_${type.value}`} className="cursor-pointer">
                    {t(type.label)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{t('Gl Account')}</Label>
            <Select
              value={form.watch('gl_account_id')}
              onValueChange={(value) => form.setValue('gl_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Gl Account')} />
              </SelectTrigger>
              <SelectContent>
                {(metaQuery.data?.gl_accounts ?? []).map((gl) => (
                  <SelectItem key={gl.id} value={String(gl.id)}>
                    {gl.account_code} - {gl.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening_balance">{t('Opening Balance')}</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                {...form.register('opening_balance')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_balance">{t('Current Balance')}</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                {...form.register('current_balance')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_gateway">{t('Payment Gateway')}</Label>
            <Input id="payment_gateway" {...form.register('payment_gateway')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">{t('Iban')}</Label>
            <Input id="iban" {...form.register('iban')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift_code">{t('Swift Code')}</Label>
            <Input id="swift_code" {...form.register('swift_code')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routing_number">{t('Routing Number')}</Label>
            <Input id="routing_number" {...form.register('routing_number')} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              {t('Is Active')}
            </Label>
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
