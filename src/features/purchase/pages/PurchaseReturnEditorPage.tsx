import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { CalendarDays, Package, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { calculateLineItemAmounts } from '@/components/commercial/tax-calculator'
import { formatCurrency } from '@/utils/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import InputError from '@/components/ui/input-error'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  createPurchaseReturn,
  fetchPurchaseReturn,
  fetchPurchaseReturnCreateMeta,
  updatePurchaseReturn,
  type EligibleReturnInvoiceItem,
} from '../purchase-returns-api'
import { PURCHASE_RETURN_REASON_OPTIONS } from '../purchase-return-utils'

type ReturnLineItem = {
  product_id: number
  original_invoice_item_id: number
  return_quantity: number
  original_quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  reason: string
  product_name: string
  product_sku?: string | null
}

function buildLineItem(
  invoiceItem: EligibleReturnInvoiceItem,
  returnQty: number,
  lineReason = '',
): ReturnLineItem {
  const calculated = calculateLineItemAmounts(
    returnQty,
    invoiceItem.unit_price,
    invoiceItem.discount_percentage,
    invoiceItem.tax_percentage,
  )

  return {
    product_id: invoiceItem.product_id,
    original_invoice_item_id: invoiceItem.id,
    return_quantity: returnQty,
    original_quantity: invoiceItem.quantity,
    unit_price: invoiceItem.unit_price,
    discount_percentage: invoiceItem.discount_percentage,
    discount_amount: calculated.discountAmount,
    tax_percentage: invoiceItem.tax_percentage,
    tax_amount: calculated.taxAmount,
    total_amount: calculated.totalAmount,
    reason: lineReason,
    product_name: invoiceItem.product?.name ?? '',
    product_sku: invoiceItem.product?.sku,
  }
}

export function PurchaseReturnEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const blockedNonDraftRef = useRef(false)

  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('defective')
  const [notes, setNotes] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [depotId, setDepotId] = useState('')
  const [returnItems, setReturnItems] = useState<ReturnLineItem[]>([])
  const [returnNumber, setReturnNumber] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const pageTitle = isEdit ? t('Edit Purchase Return') : t('Create Purchase Return')

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('Purchase'), url: paths.purchase.returns },
      { label: t('Purchase Returns'), url: paths.purchase.returns },
      { label: pageTitle },
    ],
  })

  const metaQuery = useQuery({
    queryKey: ['purchase-returns', 'create-meta'],
    queryFn: fetchPurchaseReturnCreateMeta,
  })

  const returnQuery = useQuery({
    queryKey: ['purchase-return', id],
    enabled: isEdit && Boolean(id),
    queryFn: () => fetchPurchaseReturn(id!),
  })

  const invoices = metaQuery.data?.invoices ?? []

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => String(inv.id) === invoiceId) ?? null,
    [invoices, invoiceId],
  )

  useEffect(() => {
    if (!isEdit || !returnQuery.data) return

    const row = returnQuery.data
    if (row.status !== 'draft') {
      if (!blockedNonDraftRef.current) {
        blockedNonDraftRef.current = true
        toast.error(t('Only draft returns can be edited.'))
        navigate(paths.purchase.returns, { replace: true })
      }
      return
    }

    setReturnNumber(row.return_number)
    setReturnDate(String(row.return_date).slice(0, 10))
    setReason(String(row.reason ?? 'defective'))
    setNotes(String(row.notes ?? ''))
    setInvoiceId(String(row.original_invoice_id))
    setSupplierId(String(row.supplier_id))
    setDepotId(row.depot_id ? String(row.depot_id) : '')
    setReturnItems(
      (row.items ?? []).map((item) => ({
        product_id: item.product_id,
        original_invoice_item_id: item.original_invoice_item_id ?? item.id,
        return_quantity: item.return_quantity,
        original_quantity: item.original_quantity ?? item.return_quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        tax_percentage: item.tax_percentage,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
        reason: String(item.reason ?? ''),
        product_name: item.product?.name ?? '',
        product_sku: item.product?.sku,
      })),
    )
  }, [returnQuery.data, isEdit, navigate, t])

  const handleInvoiceSelect = (value: string) => {
    setInvoiceId(value)
    const invoice = invoices.find((inv) => String(inv.id) === value)
    if (invoice) {
      setSupplierId(String(invoice.supplier_id))
      setDepotId(invoice.depot_id ? String(invoice.depot_id) : '')
    }
    if (!isEdit) {
      setReturnItems([])
    }
  }

  const addReturnItem = (invoiceItem: EligibleReturnInvoiceItem) => {
    if (returnItems.some((item) => item.original_invoice_item_id === invoiceItem.id)) return
    setReturnItems((prev) => [...prev, buildLineItem(invoiceItem, 1)])
  }

  const updateReturnItem = (
    originalInvoiceItemId: number,
    field: 'return_quantity' | 'reason',
    value: string | number,
  ) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.original_invoice_item_id !== originalInvoiceItemId) return item
        const next = { ...item, [field]: value }
        if (field === 'return_quantity') {
          const invoiceItem = selectedInvoice?.items.find(
            (i) => i.id === originalInvoiceItemId,
          )
          if (invoiceItem) {
            const qty = Math.min(
              Number(value),
              invoiceItem.available_quantity ?? invoiceItem.quantity,
            )
            return buildLineItem(invoiceItem, qty, next.reason)
          }
        }
        return next
      }),
    )
  }

  const removeReturnItem = (originalInvoiceItemId: number) => {
    setReturnItems((prev) =>
      prev.filter((item) => item.original_invoice_item_id !== originalInvoiceItemId),
    )
  }

  const totals = useMemo(() => {
    const subtotal = returnItems.reduce(
      (sum, item) => sum + item.return_quantity * item.unit_price,
      0,
    )
    const discountAmount = returnItems.reduce((sum, item) => sum + item.discount_amount, 0)
    const taxAmount = returnItems.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = returnItems.reduce((sum, item) => sum + item.total_amount, 0)
    return { subtotal, discountAmount, taxAmount, total }
  }, [returnItems])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        return_date: returnDate,
        supplier_id: Number(supplierId),
        depot_id: depotId ? Number(depotId) : null,
        original_invoice_id: Number(invoiceId),
        reason,
        notes: notes || undefined,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        total_amount: totals.total,
        items: returnItems.map((item) => ({
          product_id: item.product_id,
          original_invoice_item_id: item.original_invoice_item_id,
          original_quantity: item.original_quantity,
          quantity: item.return_quantity,
          return_quantity: item.return_quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
          reason: item.reason || undefined,
        })),
      }
      if (isEdit && id) return updatePurchaseReturn(id, body)
      return createPurchaseReturn(body)
    },
    onSuccess: (saved) => {
      toast.success(
        isEdit
          ? t('The purchase return has been updated successfully.')
          : t('The purchase return has been created successfully.'),
      )
      void queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      navigate(paths.purchase.returnShow(saved.id))
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          const map: Record<string, string> = {}
          for (const [key, messages] of Object.entries(payload.errors)) {
            if (messages[0]) map[key] = messages[0]
          }
          setFieldErrors(map)
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to save return')))
    },
  })

  if (isEdit && returnQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isEdit && blockedNonDraftRef.current) return null

  const availableInvoiceItems =
    selectedInvoice?.items.filter(
      (item) => !returnItems.some((r) => r.original_invoice_item_id === item.id),
    ) ?? []

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setFieldErrors({})
        if (!invoiceId) {
          setFieldErrors({ original_invoice_id: t('Original invoice is required') })
          return
        }
        if (returnItems.length === 0) {
          toast.error(t('Add at least one return item'))
          return
        }
        saveMutation.mutate()
      }}
      className="mx-auto max-w-6xl space-y-6 p-6"
    >
      {isEdit && returnNumber ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('Return Number')}:</span>
          <span className="font-mono font-medium">{returnNumber}</span>
          <Badge variant="secondary">{t('Draft')}</Badge>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            {t('Purchase Return Details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>{t('Return Date')} *</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
            <InputError message={fieldErrors.return_date} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>{t('Original Invoice')} *</Label>
            <Select value={invoiceId || undefined} onValueChange={handleInvoiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select invoice')} />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoice.invoice_number} — {invoice.supplier?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={fieldErrors.original_invoice_id} />
          </div>
          <div className="space-y-2">
            <Label>{t('Return Reason')} *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select Reason')} />
              </SelectTrigger>
              <SelectContent>
                {PURCHASE_RETURN_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' '))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-4">
            <Label>{t('Notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {selectedInvoice ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              {t('Invoice Items')} — {selectedInvoice.invoice_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableInvoiceItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('All items have been added.')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left">{t('Product')}</th>
                      <th className="px-3 py-2 text-right">{t('Qty')}</th>
                      <th className="px-3 py-2 text-right">{t('Unit Price')}</th>
                      <th className="px-3 py-2 text-right">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableInvoiceItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.product?.name}</div>
                          {item.product?.sku ? (
                            <div className="text-xs text-muted-foreground">
                              SKU: {item.product.sku}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addReturnItem(item)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            {t('Add')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RotateCcw className="h-5 w-5" />
            {t('Return Items')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {returnItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('Select an invoice and add items to return.')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left">{t('Product')}</th>
                    <th className="px-3 py-2 text-right">{t('Return Qty')}</th>
                    <th className="px-3 py-2 text-right">{t('Unit Price')}</th>
                    <th className="px-3 py-2 text-left">{t('Line Reason')}</th>
                    <th className="px-3 py-2 text-right">{t('Total')}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item) => (
                    <tr key={item.original_invoice_item_id} className="border-b border-border/50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{item.product_name}</div>
                        {item.product_sku ? (
                          <div className="text-xs text-muted-foreground">SKU: {item.product_sku}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min={0.01}
                          max={item.original_quantity}
                          step="0.01"
                          className="ml-auto w-24 text-right"
                          value={item.return_quantity}
                          onChange={(e) =>
                            updateReturnItem(
                              item.original_invoice_item_id,
                              'return_quantity',
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={item.reason}
                          placeholder={t('Optional reason')}
                          onChange={(e) =>
                            updateReturnItem(
                              item.original_invoice_item_id,
                              'reason',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.total_amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReturnItem(item.original_invoice_item_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="w-80 rounded-lg bg-muted/30 p-4">
              <h3 className="mb-3 font-semibold">{t('Return Summary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Discount')}</span>
                  <span className="text-destructive">-{formatCurrency(totals.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Tax')}</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{t('Total')}</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(paths.purchase.returns)}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t('Saving...') : isEdit ? t('Update') : t('Create')}
        </Button>
      </div>
    </form>
  )
}
