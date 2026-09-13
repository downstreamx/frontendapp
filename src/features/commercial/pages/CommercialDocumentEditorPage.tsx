import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { InvoiceItemsTable } from '@/components/commercial/invoice-items-table'
import { useTaxCalculator } from '@/components/commercial/tax-calculator'
import { formatCurrency } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchDepotProducts, listInvoices } from '../api'
import {
  commercialSalesOrderSchema,
  commercialPurchaseReturnSchema,
  commercialSalesReturnSchema,
} from '../schemas'
import type { CommercialInvoiceItem, CommercialProduct } from '../types'
import {
  createSalesOrder,
  createPurchaseReturn,
  createSalesReturn,
  getSalesOrder,
  getPurchaseReturn,
  getSalesReturn,
  mapItemsForSave,
  updateSalesOrder,
  updatePurchaseReturn,
  updateSalesReturn,
} from '../documents-api'
import { paths } from '@/lib/paths'

export type CommercialDocumentType = 'sales-order' | 'sales-return' | 'purchase-return'

type Props = {
  documentType: CommercialDocumentType
}

const emptyItem = (): CommercialInvoiceItem => ({
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_percentage: 0,
  discount_amount: 0,
  tax_percentage: 0,
  tax_amount: 0,
  total_amount: 0,
})

function mapLoadedItems(items: unknown[]): CommercialInvoiceItem[] {
  if (!Array.isArray(items) || items.length === 0) return [emptyItem()]
  return items.map((raw) => {
    const item = raw as Record<string, unknown>
    return {
      product_id: Number(item.product_id ?? 0),
      quantity: Number(item.return_quantity ?? item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
      discount_percentage: Number(item.discount_percentage ?? 0),
      discount_amount: Number(item.discount_amount ?? 0),
      tax_percentage: Number(item.tax_percentage ?? 0),
      tax_amount: Number(item.tax_amount ?? 0),
      total_amount: Number(item.total_amount ?? 0),
    }
  })
}

export function CommercialDocumentEditorPage({ documentType }: Props) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [products, setProducts] = useState<CommercialProduct[]>([])

  const schema =
    documentType === 'sales-order'
      ? commercialSalesOrderSchema
      : documentType === 'sales-return'
        ? commercialSalesReturnSchema
        : commercialPurchaseReturnSchema

  type FormValues = z.infer<typeof schema>

  const today = new Date().toISOString().slice(0, 10)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      documentType === 'sales-order'
        ? {
            proposal_date: today,
            due_date: today,
            customer_id: 0,
            depot_id: undefined,
            payment_terms: '',
            notes: '',
            items: [emptyItem()],
          }
        : documentType === 'sales-return'
          ? {
              return_date: today,
              customer_id: 0,
              depot_id: undefined,
              original_invoice_id: 0,
              reason: '',
              notes: '',
              items: [emptyItem()],
            }
          : {
              return_date: today,
              supplier_id: 0,
              depot_id: undefined,
              original_invoice_id: 0,
              reason: '',
              notes: '',
              items: [emptyItem()],
            },
  })

  const items = form.watch('items')
  const totals = useTaxCalculator(items)
  const depotId = form.watch('depot_id')

  const indexPath =
    documentType === 'sales-order'
      ? paths.sales.orders
      : documentType === 'sales-return'
        ? paths.sales.returns
        : paths.purchase.returns

  const showPath = (docId: number) =>
    documentType === 'sales-order'
      ? paths.sales.orderShow(docId)
      : documentType === 'sales-return'
        ? paths.sales.returnShow(docId)
        : paths.purchase.returnShow(docId)

  useQuery({
    queryKey: ['commercial-document', documentType, id],
    enabled: isEdit && Boolean(id),
    queryFn: async () => {
      const data =
        documentType === 'sales-order'
          ? await getSalesOrder(id!)
          : documentType === 'sales-return'
            ? await getSalesReturn(id!)
            : await getPurchaseReturn(id!)
      const row = data as Record<string, unknown>
      if (documentType === 'sales-order') {
        form.reset({
          proposal_date: String(row.proposal_date ?? today).slice(0, 10),
          due_date: String(row.due_date ?? today).slice(0, 10),
          customer_id: Number(row.customer_id ?? 0),
          depot_id: row.depot_id != null ? Number(row.depot_id) : undefined,
          payment_terms: String(row.payment_terms ?? ''),
          notes: String(row.notes ?? ''),
          items: mapLoadedItems(row.items as unknown[]),
        })
      } else if (documentType === 'sales-return') {
        form.reset({
          return_date: String(row.return_date ?? today).slice(0, 10),
          customer_id: Number(row.customer_id ?? 0),
          depot_id: row.depot_id != null ? Number(row.depot_id) : undefined,
          original_invoice_id: Number(row.original_invoice_id ?? 0),
          reason: String(row.reason ?? ''),
          notes: String(row.notes ?? ''),
          items: mapLoadedItems(row.items as unknown[]),
        })
      } else {
        form.reset({
          return_date: String(row.return_date ?? today).slice(0, 10),
          supplier_id: Number(row.supplier_id ?? 0),
          depot_id: row.depot_id != null ? Number(row.depot_id) : undefined,
          original_invoice_id: Number(row.original_invoice_id ?? 0),
          reason: String(row.reason ?? ''),
          notes: String(row.notes ?? ''),
          items: mapLoadedItems(row.items as unknown[]),
        })
      }
      return data
    },
  })

  const { data: salesInvoices = [] } = useQuery({
    queryKey: ['sales-invoices-for-return'],
    enabled: documentType === 'sales-return',
    queryFn: async () => {
      const data = await listInvoices('sales')
      return extractInvoices(data)
    },
  })

  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ['purchase-invoices-for-return'],
    enabled: documentType === 'purchase-return',
    queryFn: async () => {
      const data = await listInvoices('purchase')
      return extractInvoices(data)
    },
  })

  function extractInvoices(data: unknown) {
    const rows = (data as { data?: Array<{ id: number; invoice_number?: string; customer_id?: number; supplier_id?: number }> })
      ?.data
    return Array.isArray(rows) ? rows : []
  }

  useEffect(() => {
    if (!depotId) {
      setProducts([])
      return
    }
    fetchDepotProducts(String(depotId)).then((rows) => {
      setProducts(
        (rows as CommercialProduct[]).map((r) => ({
          ...r,
          sale_price: Number(r.sale_price ?? (r as { price?: number }).price ?? 0),
        })),
      )
    })
  }, [depotId])

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        ...values,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        total_amount: totals.total,
        items: mapItemsForSave(values.items),
      }
      if (documentType === 'sales-order') {
        return isEdit && id ? updateSalesOrder(id, body) : createSalesOrder(body)
      }
      if (documentType === 'sales-return') {
        return isEdit && id ? updateSalesReturn(id, body) : createSalesReturn(body)
      }
      return isEdit && id ? updatePurchaseReturn(id, body) : createPurchaseReturn(body)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: [documentType] })
      toast.success(t('Saved'))
      const docId = (saved as { id: number }).id
      navigate(showPath(docId))
    },
    onError: () => toast.error(t('Failed to save')),
  })

  const title =
    documentType === 'sales-order'
      ? isEdit
        ? t('Edit sales order')
        : t('Create sales order')
      : documentType === 'sales-return'
        ? isEdit
          ? t('Edit sales return')
          : t('Create sales return')
        : isEdit
          ? t('Edit purchase return')
          : t('Create purchase return')

  return (
    <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Link to={indexPath} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {documentType === 'sales-order' ? (
            <>
              <div className="space-y-2">
                <Label>{t('Proposal date')}</Label>
                <Input type="date" {...form.register('proposal_date')} />
              </div>
              <div className="space-y-2">
                <Label>{t('Due date')}</Label>
                <Input type="date" {...form.register('due_date')} />
              </div>
              <div className="space-y-2">
                <Label>{t('Customer ID')}</Label>
                <Input type="number" {...form.register('customer_id', { valueAsNumber: true })} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t('Return date')}</Label>
                <Input type="date" {...form.register('return_date')} />
              </div>
              {documentType === 'sales-return' ? (
                <div className="space-y-2">
                  <Label>{t('Customer ID')}</Label>
                  <Input type="number" {...form.register('customer_id', { valueAsNumber: true })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t('Supplier ID')}</Label>
                  <Input type="number" {...form.register('supplier_id', { valueAsNumber: true })} />
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>{t('Original invoice')}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={String(form.watch('original_invoice_id') || '')}
                  onChange={(e) => {
                    const invId = Number(e.target.value)
                    form.setValue('original_invoice_id', invId)
                    const list = documentType === 'sales-return' ? salesInvoices : purchaseInvoices
                    const inv = list.find((i) => i.id === invId)
                    if (inv?.customer_id) form.setValue('customer_id', inv.customer_id)
                    if (inv && 'supplier_id' in inv && inv.supplier_id) {
                      form.setValue('supplier_id', inv.supplier_id)
                    }
                  }}
                >
                  <option value="">{t('Select invoice')}</option>
                  {(documentType === 'sales-return' ? salesInvoices : purchaseInvoices).map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number ?? `#${inv.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('Reason')}</Label>
                <Input {...form.register('reason')} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>{t('Depot ID')}</Label>
            <Input type="number" {...form.register('depot_id', { valueAsNumber: true })} />
          </div>
          {documentType === 'sales-order' && (
            <div className="space-y-2">
              <Label>{t('Payment terms')}</Label>
              <Input {...form.register('payment_terms')} />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>{t('Notes')}</Label>
            <Textarea {...form.register('notes')} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Line items')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceItemsTable
            items={items}
            products={products}
            invoiceType="product"
            onChange={(next) => form.setValue('items', next)}
          />
          <Separator className="my-4" />
          <div className="flex flex-col items-end gap-1 text-sm">
            <div>
              {t('Subtotal')}: {formatCurrency(totals.subtotal)}
            </div>
            <div>
              {t('Tax')}: {formatCurrency(totals.taxAmount)}
            </div>
            <div className="font-semibold text-base">
              {t('Total')}: {formatCurrency(totals.total)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {t('Save')}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(indexPath)}>
          {t('Cancel')}
        </Button>
      </div>
    </form>
  )
}
