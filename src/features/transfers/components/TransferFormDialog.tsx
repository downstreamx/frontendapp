import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createZodResolver } from '@/lib/form/zod-resolver'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EntitySelect } from '@/components/forms/entity-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toProductLookupOptions } from '@/features/_shared/operations-lookups'
import { listDepots } from '@/features/depots/api'
import { listProductsAll } from '@/features/inventory/api'
import { createTransfer } from '../api'
import { transferSchema } from '../schemas'

type TransferFormValues = z.infer<typeof transferSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (saved: { id: number }) => void
}

export function TransferFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const { t } = useTranslation()

  const { data: depots = [] } = useQuery({
    queryKey: ['depots'],
    queryFn: () => listDepots(),
    enabled: open,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['product-service', 'items'],
    queryFn: () => listProductsAll(),
    enabled: open,
  })

  const form = useForm<TransferFormValues>({
    resolver: createZodResolver(
      transferSchema.refine((v) => v.from_depot !== v.to_depot, {
        message: t('From and to depot must differ'),
        path: ['to_depot'],
      }),
    ),
    defaultValues: {
      from_depot: 0,
      to_depot: 0,
      product_id: 0,
      quantity: 1,
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      from_depot: 0,
      to_depot: 0,
      product_id: 0,
      quantity: 1,
      notes: '',
    })
  }, [open, form])

  const create = useMutation({
    mutationFn: (values: TransferFormValues) => createTransfer(values),
    onSuccess: (saved) => {
      toast.success(t('Transfer created'))
      onSuccess?.(saved)
      onOpenChange(false)
    },
    onError: () => toast.error(t('Failed to create transfer')),
  })

  const fromDepot = String(form.watch('from_depot') || '')
  const toDepot = String(form.watch('to_depot') || '')
  const productId = String(form.watch('product_id') || '')

  const productOptions = toProductLookupOptions(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      image: p.image,
    })),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Create transfer')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('From depot')}</Label>
            <Select value={fromDepot} onValueChange={(v) => form.setValue('from_depot', Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select depot')} />
              </SelectTrigger>
              <SelectContent>
                {depots.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('To depot')}</Label>
            <Select value={toDepot} onValueChange={(v) => form.setValue('to_depot', Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select depot')} />
              </SelectTrigger>
              <SelectContent>
                {depots.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Product')}</Label>
            <EntitySelect
              value={productId}
              onValueChange={(v) => form.setValue('product_id', Number(v))}
              options={productOptions}
              placeholder={t('Select product')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-quantity">{t('Quantity')}</Label>
            <Input id="transfer-quantity" type="number" step="0.001" {...form.register('quantity')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">{t('Notes')}</Label>
            <Input id="transfer-notes" {...form.register('notes')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
