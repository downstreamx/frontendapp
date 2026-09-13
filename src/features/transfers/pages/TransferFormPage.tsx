import { useForm } from 'react-hook-form'
import { createZodResolver } from '@/lib/form/zod-resolver'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { toProductLookupOptions } from '@/features/_shared/operations-lookups'
import { listDepots } from '@/features/depots/api'
import { listProductsAll } from '@/features/inventory/api'
import { createTransfer } from '../api'
import { transferSchema } from '../schemas'
import { paths } from '@/lib/paths'

type TransferFormValues = z.infer<typeof transferSchema>

export function TransferFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: depots = [] } = useQuery({
    queryKey: ['depots'],
    queryFn: () => listDepots(),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['product-service', 'items'],
    queryFn: () => listProductsAll(),
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

  const create = useMutation({
    mutationFn: (values: TransferFormValues) => createTransfer(values),
    onSuccess: (saved) => {
      toast.success(t('Transfer created'))
      navigate(paths.transfers.show(saved.id))
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
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('Create transfer')}</h1>
        <Link to={paths.transfers.index} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="quantity">{t('Quantity')}</Label>
              <Input id="quantity" type="number" step="0.001" {...form.register('quantity')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('Notes')}</Label>
              <Input id="notes" {...form.register('notes')} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              {t('Save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
