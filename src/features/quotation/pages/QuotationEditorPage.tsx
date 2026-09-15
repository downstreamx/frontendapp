import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { PaymentTermsSelect } from '@/components/setup/PaymentTermsSelect'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  createQuotation,
  getQuotation,
  updateQuotation,
  type QuotationLineInput,
} from '../quotations-api'
import { useQuotationMeta } from '../hooks/use-quotation-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type LineRow = QuotationLineInput & { key: string }

const emptyLine = (): LineRow => ({
  key: crypto.randomUUID(),
  product_id: 0,
  quantity: 1,
  unit_price: 0,
})

export function QuotationEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [customerId, setCustomerId] = useState('')
  const [depotId, setDepotId] = useState('')
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [lines, setLines] = useState<LineRow[]>([emptyLine()])

  const { customerOptions, depotOptions, productOptions, meta, isLoading: metaLoading } = useQuotationMeta()

  const quotationQuery = useQuery({
    queryKey: ['quotations', id],
    queryFn: () => getQuotation(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = quotationQuery.data
    if (!row) return
    if (row.status !== 'draft') {
      toast.error(t('Only draft quotations can be edited.'))
      navigate(paths.quotation.show(row.id), { replace: true })
      return
    }
    setCustomerId(String(row.customer_id))
    setDepotId(row.depot?.id ? String(row.depot.id) : '')
    setQuotationDate(row.quotation_date?.slice(0, 10) ?? '')
    setDueDate(row.due_date?.slice(0, 10) ?? '')
    setNotes(row.notes ?? '')
    setPaymentTerms(row.payment_terms ?? '')
    setLines(
      (row.items ?? []).map((item) => ({
        key: String(item.id),
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    )
  }, [quotationQuery.data, navigate, t])

  usePageChrome({
    pageTitle: isEdit ? t('Edit quotation') : t('Create quotation'),
    breadcrumbs: [
      { label: t('Quotations'), url: paths.quotation.index },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0),
    [lines],
  )

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!depotId) {
        throw new Error('Depot is required')
      }
      const items = lines.filter((line) => line.product_id > 0)
      const payload = {
        customer_id: Number(customerId),
        depot_id: Number(depotId),
        quotation_date: quotationDate,
        due_date: dueDate,
        notes: notes || undefined,
        payment_terms: paymentTerms || undefined,
        items,
      }
      return isEdit ? updateQuotation(Number(id), payload) : createQuotation(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Quotation updated') : t('Quotation created'))
      void queryClient.invalidateQueries({ queryKey: ['quotation', 'quotations'] })
      navigate(paths.quotation.show(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save quotation'))),
  })

  const updateLine = (key: string, patch: Partial<LineRow>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  const onProductChange = (key: string, productId: string) => {
    const product = meta?.products.find((p) => String(p.id) === productId)
    updateLine(key, {
      product_id: Number(productId),
      unit_price: product?.sale_price != null ? Number(product.sale_price) : 0,
    })
  }

  if (isEdit && quotationQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <form
      className="mx-auto max-w-4xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!customerId) return
        if (lines.every((line) => line.product_id <= 0)) {
          toast.error(t('Add at least one product line.'))
          return
        }
        saveMutation.mutate()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('Quotation details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>{t('Customer')}</Label>
            <EntitySelect
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value)
                const customer = meta?.customers.find((row) => String(row.id) === value)
                if (customer?.payment_terms) {
                  setPaymentTerms(customer.payment_terms)
                }
              }}
              options={customerOptions}
              required
              disabled={metaLoading}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Depot')}</Label>
            <EntitySelect
              value={depotId}
              onValueChange={setDepotId}
              options={depotOptions}
              disabled={metaLoading}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Quotation date')}</Label>
            <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Due date')}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{t('Payment terms')}</Label>
            <PaymentTermsSelect
              value={paymentTerms}
              options={meta?.payment_terms ?? []}
              onChange={setPaymentTerms}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{t('Notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('Line items')}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
            <Plus className="mr-1 h-4 w-4" />
            {t('Add line')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line) => (
            <div key={line.key} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_100px_120px_40px]">
              <EntitySelect
                value={line.product_id ? String(line.product_id) : ''}
                onValueChange={(value) => onProductChange(line.key, value)}
                options={productOptions}
                placeholder={t('Product')}
                disabled={metaLoading}
              />
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.unit_price}
                onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) })}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <p className="text-right text-sm font-medium">
            {t('Subtotal')}: {formatCurrency(subtotal)}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {t('Save')}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={isEdit && id ? paths.quotation.show(id) : paths.quotation.index}>{t('Cancel')}</Link>
        </Button>
      </div>
    </form>
  )
}
