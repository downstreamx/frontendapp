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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createAccountType,
  fetchAccountTypeCreateMeta,
  generateAccountTypeCode,
  updateAccountType,
  type AccountTypeRow,
} from '../account-types-api'

const schema = z.object({
  category_id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  normal_balance: z.enum(['debit', 'credit']),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  accountType?: AccountTypeRow | null
  onSuccess: () => void
}

function capitalizeName(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toFormValues(accountType?: AccountTypeRow | null): FormValues {
  return {
    category_id: accountType?.category_id ? String(accountType.category_id) : '',
    name: accountType?.name ?? '',
    code: accountType?.code ?? '',
    normal_balance: accountType?.normal_balance ?? 'debit',
    description: accountType?.description ?? '',
    is_active: accountType?.is_active ?? true,
  }
}

export function AccountTypeFormDialog({
  open,
  onOpenChange,
  mode,
  accountType,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit'
  const isSystemType = Boolean(accountType?.is_system_type)

  const metaQuery = useQuery({
    queryKey: ['account-types', 'create-meta'],
    queryFn: fetchAccountTypeCreateMeta,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(isEdit ? accountType : null))
    }
  }, [open, accountType, isEdit, form])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        category_id: Number(values.category_id),
        name: values.name,
        code: values.code,
        normal_balance: values.normal_balance,
        description: values.description || undefined,
        is_active: values.is_active,
      }

      return isEdit && accountType
        ? updateAccountType(accountType.id, payload)
        : createAccountType(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The account type details are updated successfully.')
          : t('The account type has been created successfully.'),
      )
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? t('Failed to update account type') : t('Failed to create account type'),
        ),
      ),
  })

  const categories = metaQuery.data?.account_categories ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit Account Type') : t('Create Account Type')}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        >
          <div className="space-y-1">
            <Label required>{t('Category')}</Label>
            <Select
              value={form.watch('category_id') || undefined}
              onValueChange={(value) => form.setValue('category_id', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('Name')}</Label>
            <Input
              value={form.watch('name')}
              disabled={isEdit && isSystemType}
              placeholder={t('Enter Name')}
              onChange={(e) => {
                const name = capitalizeName(e.target.value)
                form.setValue('name', name, { shouldValidate: true })
                if (!isEdit || !isSystemType) {
                  form.setValue('code', generateAccountTypeCode(name), { shouldValidate: true })
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>{t('Code')}</Label>
            <Input value={form.watch('code')} disabled placeholder={t('Auto-generated from name')} />
          </div>

          <div className="space-y-1">
            <Label>{t('Normal Balance')}</Label>
            <RadioGroup
              value={form.watch('normal_balance')}
              onValueChange={(value) =>
                form.setValue('normal_balance', value as 'debit' | 'credit', { shouldValidate: true })
              }
              className="mt-2 flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="normal_balance_debit" />
                <Label htmlFor="normal_balance_debit" className="cursor-pointer">
                  {t('debit')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="normal_balance_credit" />
                <Label htmlFor="normal_balance_credit" className="cursor-pointer">
                  {t('credit')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea
              rows={3}
              placeholder={t('Enter Description')}
              value={form.watch('description') ?? ''}
              onChange={(e) => form.setValue('description', e.target.value)}
            />
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
            <Button type="submit" disabled={saveMutation.isPending || metaQuery.isLoading}>
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
