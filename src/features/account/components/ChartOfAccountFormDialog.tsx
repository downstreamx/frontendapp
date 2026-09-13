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
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  createChartOfAccount,
  getChartOfAccountCreateMeta,
  updateChartOfAccount,
  type ChartOfAccount,
  type ChartOfAccountInput,
} from '../chart-of-accounts-api'

const formSchema = z
  .object({
    account_type_id: z.string().min(1),
    account_name: z.string().min(1),
    account_code: z.string().min(1),
    normal_balance: z.enum(['debit', 'credit']),
    opening_balance: z.string(),
    current_balance: z.string(),
    is_active: z.boolean(),
    is_sub_account: z.boolean(),
    parent_account_id: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.is_sub_account ||
      (Boolean(data.parent_account_id) && data.parent_account_id !== '0'),
    {
      message: 'Parent account is required for sub accounts',
      path: ['parent_account_id'],
    },
  )

type FormValues = z.infer<typeof formSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  account?: ChartOfAccount | null
  onSuccess: () => void
}

function toFormValues(account?: ChartOfAccount | null): FormValues {
  const hasParent = Boolean(account?.parent_account_id)
  return {
    account_type_id: account?.account_type_id ? String(account.account_type_id) : '',
    account_name: account?.account_name ?? '',
    account_code: account?.account_code ?? '',
    normal_balance: (account?.normal_balance as 'debit' | 'credit') ?? 'debit',
    opening_balance: String(account?.opening_balance ?? ''),
    current_balance: String(account?.current_balance ?? account?.opening_balance ?? ''),
    is_active: account?.is_active ?? true,
    is_sub_account: hasParent,
    parent_account_id: hasParent ? String(account?.parent_account_id) : '',
    description: account?.description ?? '',
  }
}

function parseAmount(value: string): number {
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function toPayload(values: FormValues): ChartOfAccountInput {
  const parentId =
    values.is_sub_account && values.parent_account_id && values.parent_account_id !== '0'
      ? Number(values.parent_account_id)
      : null
  const opening = parseAmount(values.opening_balance)
  const current = parseAmount(values.current_balance || values.opening_balance)

  return {
    account_type_id: Number(values.account_type_id),
    account_name: values.account_name,
    account_code: values.account_code,
    normal_balance: values.normal_balance,
    opening_balance: opening,
    current_balance: current,
    is_active: values.is_active,
    description: values.description || undefined,
    parent_account_id: parentId,
    level: parentId ? 2 : 1,
  }
}

export function ChartOfAccountFormDialog({
  open,
  onOpenChange,
  mode,
  account,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'
  const isSystem = Boolean(account?.is_system_account)

  const metaQuery = useQuery({
    queryKey: ['chart-of-accounts', 'create-meta'],
    queryFn: getChartOfAccountCreateMeta,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(isEdit ? account : null))
    }
  }, [open, account, isEdit, form])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(values)
      return isEdit && account
        ? updateChartOfAccount(account.id, payload)
        : createChartOfAccount(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The chart of account details are updated successfully.')
          : t('The chart of account has been created successfully.'),
      )
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? t('Failed to update chart of account') : t('Failed to create chart of account'),
        ),
      ),
  })

  const accountTypes = metaQuery.data?.account_types ?? []
  const parentAccounts = (metaQuery.data?.parent_accounts ?? []).filter(
    (parent) => !isEdit || parent.id !== account?.id,
  )
  const isSubAccount = form.watch('is_sub_account')
  const accountTypeId = form.watch('account_type_id')

  useEffect(() => {
    if (!accountTypeId) return
    const selectedType = accountTypes.find((type) => String(type.id) === accountTypeId)
    if (
      selectedType?.normal_balance === 'debit' ||
      selectedType?.normal_balance === 'credit'
    ) {
      form.setValue('normal_balance', selectedType.normal_balance)
    }
  }, [accountTypeId, accountTypes, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit Chart Of Account') : t('Create Chart Of Account')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>{t('Account Type')}</Label>
            <Select
              value={accountTypeId}
              onValueChange={(value) => form.setValue('account_type_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Account Type')} />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.account_type_id ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_type_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">{t('Account Name')}</Label>
            <Input
              id="account_name"
              placeholder={t('Enter Account Name')}
              disabled={isEdit && isSystem}
              {...form.register('account_name')}
            />
            {form.formState.errors.account_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_code">{t('Account Code')}</Label>
            <Input
              id="account_code"
              placeholder={t('Enter Account Code')}
              disabled={isEdit && isSystem}
              {...form.register('account_code')}
            />
            {form.formState.errors.account_code ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_code.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('Normal Balance')}</Label>
            <RadioGroup
              value={form.watch('normal_balance')}
              onValueChange={(value) =>
                form.setValue('normal_balance', value as 'debit' | 'credit')
              }
              className="mt-2 flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="normal_balance_debit" />
                <Label htmlFor="normal_balance_debit" className="cursor-pointer">
                  {t('Debit')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="normal_balance_credit" />
                <Label htmlFor="normal_balance_credit" className="cursor-pointer">
                  {t('Credit')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <CurrencyInput
            label={t('Opening Balance')}
            value={form.watch('opening_balance')}
            onChange={(value) => form.setValue('opening_balance', value)}
            error={form.formState.errors.opening_balance?.message}
            required
          />

          <CurrencyInput
            label={t('Current Balance')}
            value={form.watch('current_balance')}
            onChange={(value) => form.setValue('current_balance', value)}
            error={form.formState.errors.current_balance?.message}
            required
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                disabled={isEdit && isSystem}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                {t('Is Active')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_sub_account"
                checked={isSubAccount}
                onCheckedChange={(checked) => {
                  form.setValue('is_sub_account', checked === true)
                  if (!checked) {
                    form.setValue('parent_account_id', '')
                  }
                }}
              />
              <Label htmlFor="is_sub_account" className="cursor-pointer">
                {t('Create as sub account')}
              </Label>
            </div>
          </div>

          {isSubAccount ? (
            <div className="space-y-2">
              <Label>{t('Parent Account')}</Label>
              <Select
                value={form.watch('parent_account_id') || ''}
                onValueChange={(value) => form.setValue('parent_account_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Parent Account')} />
                </SelectTrigger>
                <SelectContent>
                  {parentAccounts.map((parent) => (
                    <SelectItem key={parent.id} value={String(parent.id)}>
                      {parent.account_name}
                      {parent.account_code ? ` (${parent.account_code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.parent_account_id ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.parent_account_id.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder={t('Enter Description')}
              {...form.register('description')}
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
