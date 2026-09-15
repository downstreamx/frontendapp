import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createPosSale, getPosSale, updatePosSale } from '../pos-api'
import { usePosMeta } from '../hooks/use-pos-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type LineRow = { product_id: string; quantity: string; price: string }

const emptyLine = (): LineRow => ({ product_id: '', quantity: '1', price: '' })

export function PosFormPage() {
  const { id } = useParams()
  const saleId = Number(id)
  const isEdit = Number.isFinite(saleId)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    meta,
    depotOptions,
    customerOptions,
    productOptions,
    bankAccountOptions,
    isLoading: metaLoading,
  } = usePosMeta()
  const [posDate, setPosDate] = useState(new Date().toISOString().slice(0, 10))
  const [depotId, setDepotId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [lines, setLines] = useState<LineRow[]>([emptyLine()])

  const saleQuery = useQuery({
    queryKey: ['pos', saleId],
    queryFn: () => getPosSale(saleId),
    enabled: isEdit,
  })

  useEffect(() => {
    const sale = saleQuery.data
    if (!sale) return
    setPosDate(sale.pos_date?.slice(0, 10) ?? posDate)
    setDepotId(sale.depot_id != null ? String(sale.depot_id) : '')
    setCustomerId(sale.customer_id != null ? String(sale.customer_id) : '')
    setBankAccountId(sale.bank_account_id != null ? String(sale.bank_account_id) : '')
    setLines(
      sale.items?.length
        ? sale.items.map((item) => ({
            product_id: String(item.product_id),
            quantity: String(item.quantity),
            price: String(item.price),
          }))
        : [emptyLine()],
    )
  }, [saleQuery.data])

  useEffect(() => {
    if (isEdit || bankAccountId || bankAccountOptions.length === 0) return
    setBankAccountId(String(bankAccountOptions[0].id))
  }, [isEdit, bankAccountId, bankAccountOptions])

  usePageChrome({
    pageTitle: isEdit ? t('Edit POS sale') : t('Add POS'),
    breadcrumbs: [
      { label: t('POS'), url: paths.pos.index },
      { label: t('Orders'), url: paths.pos.orders },
      ...(isEdit
        ? [{ label: saleQuery.data?.sale_number ?? `#${id}` }]
        : [{ label: t('Add POS') }]),
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!isEdit && !depotId) {
        throw new Error('Depot is required')
      }
      const payload = {
        pos_date: posDate,
        depot_id: depotId ? Number(depotId) : undefined,
        customer_id: customerId ? Number(customerId) : undefined,
        bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
        items: lines
          .filter((line) => line.product_id && line.quantity && line.price)
          .map((line) => ({
            product_id: Number(line.product_id),
            quantity: Number(line.quantity),
            price: Number(line.price),
          })),
      }
      return isEdit
        ? updatePosSale(saleId, payload)
        : createPosSale({ ...payload, depot_id: Number(depotId) })
    },
    onSuccess: (sale) => {
      toast.success(isEdit ? t('Sale updated') : t('Sale created'))
      navigate(paths.pos.show(sale.id))
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, isEdit ? t('Failed to update sale') : t('Failed to create sale'))),
  })

  const lineTotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0
    const price = Number(line.price) || 0
    return sum + qty * price
  }, 0)

  if (isEdit && saleQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEdit ? t('Edit POS sale') : t('New POS sale')}</CardTitle>
        <Link
          to={isEdit ? paths.pos.show(saleId) : paths.pos.orders}
          className="text-sm text-primary hover:underline"
        >
          {t('Back')}
        </Link>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (lines.every((l) => !l.product_id)) {
              toast.error(t('Add at least one line item'))
              return
            }
            saveMutation.mutate()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>{t('Date')}</Label>
              <Input type="date" value={posDate} onChange={(e) => setPosDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Depot')}</Label>
              <EntitySelect
                value={depotId}
                onValueChange={setDepotId}
                options={depotOptions}
                placeholder={t('Select depot')}
                disabled={metaLoading}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Customer')}</Label>
              <EntitySelect
                value={customerId}
                onValueChange={setCustomerId}
                options={customerOptions}
                placeholder={t('Optional')}
                disabled={metaLoading}
              />
            </div>
            {bankAccountOptions.length > 0 ? (
              <div className="space-y-1">
                <Label>{t('Bank account')}</Label>
                <EntitySelect
                  value={bankAccountId}
                  onValueChange={setBankAccountId}
                  options={bankAccountOptions}
                  placeholder={t('Default if empty')}
                  disabled={metaLoading}
                />
                <p className="text-xs text-muted-foreground">
                  {t('If unset, the first active bank with a GL account is used for posting.')}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('Line items')}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLines((rows) => [...rows, emptyLine()])}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('Add line')}
              </Button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-4">
                <EntitySelect
                  value={line.product_id}
                  onValueChange={(value) => {
                    const product = meta?.products.find((p) => String(p.id) === value)
                    setLines((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? {
                              ...row,
                              product_id: value,
                              price:
                                row.price ||
                                (product?.sale_price != null ? String(product.sale_price) : ''),
                            }
                          : row,
                      ),
                    )
                  }}
                  options={productOptions}
                  placeholder={t('Product')}
                  disabled={metaLoading}
                />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={t('Qty')}
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((rows) =>
                      rows.map((row, i) => (i === index ? { ...row, quantity: e.target.value } : row)),
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('Price')}
                  value={line.price}
                  onChange={(e) =>
                    setLines((rows) =>
                      rows.map((row, i) => (i === index ? { ...row, price: e.target.value } : row)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={lines.length === 1}
                  onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-right text-sm font-medium">
            {t('Total')}: {lineTotal.toFixed(2)}
          </p>

          <Button type="submit" disabled={saveMutation.isPending}>
            {isEdit ? t('Save changes') : t('Create sale')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
