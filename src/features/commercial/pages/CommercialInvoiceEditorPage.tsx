import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createZodResolver } from '@/lib/form/zod-resolver'
import type { Resolver } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { CalendarDays, Package, Plus } from 'lucide-react'
import { InvoiceItemsTable } from '@/components/commercial/invoice-items-table'
import { useTaxCalculator } from '@/components/commercial/tax-calculator'
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
import { EntitySelect } from '@/components/forms/entity-select'
import {
  toCustomerLookupOptions,
  toSupplierLookupOptions,
} from '@/features/_shared/operations-lookups'
import { Separator } from '@/components/ui/separator'
import InputError from '@/components/ui/input-error'
import { PaymentTermsSelect } from '@/components/setup/PaymentTermsSelect'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  type CommercialKind,
} from '../api'
import {
  buildPurchaseInvoiceCreateSchema,
  buildPurchaseInvoiceEditSchema,
  buildSalesInvoiceCreateSchema,
  buildSalesInvoiceEditSchema,
} from '../schemas'
import {
  commercialDetailHeaderCardClass,
  commercialItemsPanelCardClass,
} from '../commercial-page-styles'
import { buildPurchaseInvoicePayload } from '../purchase-invoice-payload'
import { buildSalesInvoicePayload } from '../sales-invoice-payload'
import {
  mapPurchaseInvoiceToFormValues,
  type PurchaseInvoiceApiRow,
} from '../purchase-invoice-form-utils'
import {
  mapSalesInvoiceToFormValues,
  type SalesInvoiceApiRow,
} from '../sales-invoice-form-utils'
import { validateDepotStockQuantities } from '../depot-stock-validation'
import type { CommercialInvoiceFormValues, CommercialProduct } from '../types'
import {
  fetchPurchaseDepotProducts,
  fetchPurchaseInvoiceCreateMeta,
} from '@/features/purchase/purchase-invoices-api'
import {
  fetchSalesDepotProducts,
  fetchSalesInvoiceCreateMeta,
} from '@/features/sales/sales-invoices-api'
import { usePageChrome } from '@/contexts/page-chrome-context'
import type {
  PurchaseInvoiceCreateMeta,
  PurchaseInvoiceSupplier,
} from '@/features/purchase/purchase-invoices-api'
import type { SalesInvoiceCreateMeta, SalesInvoiceCustomer } from '@/features/sales/sales-invoices-api'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import { PurchaseInvoiceCreditLimitAlert } from '../components/PurchaseInvoiceCreditLimitAlert'
import { SalesInvoiceCreditLimitAlert } from '../components/SalesInvoiceCreditLimitAlert'
type Props = {
  kind: CommercialKind
  indexPath: string
}

const emptyItem = (): CommercialInvoiceFormValues['items'][0] => ({
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_percentage: 0,
  discount_amount: 0,
  tax_percentage: 0,
  tax_amount: 0,
  total_amount: 0,
})

const defaultValues: CommercialInvoiceFormValues = {
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  customer_id: '',
  supplier_id: '',
  depot_id: '',
  loading_depot_id: '',
  type: 'product',
  payment_terms: '',
  notes: '',
  items: [emptyItem()],
}

function apiErrorsToFieldMap(errors?: Record<string, string[]>): Record<string, string> {
  if (!errors) return {}
  const map: Record<string, string> = {}
  for (const [key, messages] of Object.entries(errors)) {
    if (messages[0]) map[key] = messages[0]
  }
  return map
}

export function CommercialInvoiceEditorPage({ kind, indexPath }: Props) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const isSales = kind === 'sales'
  const isPurchase = kind === 'purchase'
  const [products, setProducts] = useState<CommercialProduct[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null)
  const blockedNonDraftRef = useRef(false)

  const metaQuery = useQuery<SalesInvoiceCreateMeta | PurchaseInvoiceCreateMeta>({
    queryKey: queryKeys.commercial.invoiceCreateMeta(kind),
    queryFn: isSales ? fetchSalesInvoiceCreateMeta : fetchPurchaseInvoiceCreateMeta,
    enabled: isSales || isPurchase,
  })

  const singleLineItems = isSales
    ? (metaQuery.data?.line_item_settings?.single_line_sales_invoice ?? true)
    : isPurchase
      ? (metaQuery.data?.line_item_settings?.single_line_purchase_invoice ?? true)
      : false

  const schema = useMemo(() => {
    if (isSales) {
      return isEdit
        ? buildSalesInvoiceEditSchema({ singleLine: singleLineItems })
        : buildSalesInvoiceCreateSchema({ singleLine: singleLineItems })
    }
    return isEdit
      ? buildPurchaseInvoiceEditSchema({ singleLine: singleLineItems })
      : buildPurchaseInvoiceCreateSchema({ singleLine: singleLineItems })
  }, [isEdit, isSales, singleLineItems])

  const form = useForm<CommercialInvoiceFormValues>({
    resolver: createZodResolver(schema) as Resolver<CommercialInvoiceFormValues>,
    defaultValues,
  })

  const items = form.watch('items')
  const invoiceType = form.watch('type')
  const depotId = form.watch('depot_id')
  const customerUserId = form.watch('customer_id')
  const supplierUserId = form.watch('supplier_id')
  const paymentTerms = form.watch('payment_terms')
  const totals = useTaxCalculator(items)
  const selectedProductIds = useMemo(
    () =>
      items
        .map((item) => item.product_id)
        .filter((id) => id > 0)
        .sort((a, b) => a - b)
        .join(','),
    [items],
  )

  const pageTitle = isSales
    ? isEdit
      ? t('Edit Sales Invoice')
      : t('Create Sales Invoice')
    : isEdit
      ? t('Edit Purchase Invoice')
      : t('Create Purchase Invoice')

  usePageChrome({
    pageTitle,
    centerPageTitle: !isEdit,
    breadcrumbs: isPurchase
      ? [
          { label: t('Purchase'), url: indexPath },
          { label: t('Purchase Invoices') },
          { label: pageTitle },
        ]
      : [{ label: pageTitle, url: indexPath }],
  })

  const invoiceQuery = useQuery({
    queryKey: queryKeys.commercial.invoice(kind, id),
    enabled: isEdit && Boolean(id),
    queryFn: () => getInvoice(kind, id!),
  })

  useEffect(() => {
    if (!isEdit || !invoiceQuery.data) return

    const row = invoiceQuery.data as SalesInvoiceApiRow & PurchaseInvoiceApiRow

    if (row.status && row.status !== 'draft') {
      if (!blockedNonDraftRef.current) {
        blockedNonDraftRef.current = true
        toast.error(t('Cannot update posted invoice.'))
        navigate(indexPath, { replace: true })
      }
      return
    }

    setInvoiceNumber(row.invoice_number ?? null)
    form.reset(
      isSales ? mapSalesInvoiceToFormValues(row) : mapPurchaseInvoiceToFormValues(row),
    )
  }, [invoiceQuery.data, isEdit, isSales, form, navigate, indexPath, t])

  useEffect(() => {
    if (!isSales) return
    if (isEdit && !invoiceQuery.data) return

    const loadProducts = async () => {
      if (!depotId) {
        setProducts([])
        return
      }

      const includeProductIds = selectedProductIds
        ? selectedProductIds.split(',').map((id) => Number(id))
        : []

      const rows = await fetchSalesDepotProducts(depotId, { includeProductIds })
      setProducts(rows as CommercialProduct[])
    }

    void loadProducts()
  }, [isSales, isEdit, depotId, invoiceQuery.data, selectedProductIds])

  useEffect(() => {
    if (!isPurchase) return
    if (isEdit && !invoiceQuery.data) return
    if (!metaQuery.isSuccess) return

    const loadProducts = async () => {
      const rows = await fetchPurchaseDepotProducts(depotId || 0)
      setProducts(rows as CommercialProduct[])
    }

    void loadProducts()
  }, [isPurchase, isEdit, depotId, invoiceQuery.data, metaQuery.isSuccess])

  useEffect(() => {
    if (!singleLineItems || items.length <= 1) return
    form.setValue('items', items.slice(0, 1))
  }, [singleLineItems, items, form])

  const handleDepotChange = (value: string) => {
    form.setValue('depot_id', value)
    if (!isEdit) {
      form.setValue('items', [emptyItem()])
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (values: CommercialInvoiceFormValues) => {
      const body = isSales
        ? buildSalesInvoicePayload(values, totals)
        : buildPurchaseInvoicePayload(values, totals)
      if (isEdit && id) return updateInvoice(kind, id, body)
      return createInvoice(kind, body)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? isSales
            ? t('The sales invoice has been updated successfully.')
            : t('The purchase invoice has been updated successfully.')
          : isSales
            ? t('The sales invoice has been created successfully.')
            : t('The purchase invoice has been created successfully.'),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.all() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.invoices.all() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.commercial.invoice(kind, id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.commercial.invoice(kind) })
      navigate(indexPath)
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as
          | {
              errors?: Record<string, string[]>
              message?: string
              code?: string
            }
          | undefined
        if (payload?.errors) {
          setFieldErrors(apiErrorsToFieldMap(payload.errors))
        }
        if (payload?.message?.includes('draft')) {
          toast.error(t('Cannot update posted invoice.'))
          navigate(indexPath, { replace: true })
          return
        }
        if (
          payload?.code === 'credit_limit_required' ||
          payload?.code === 'credit_limit_exceeded'
        ) {
          toast.error(payload.message ?? t('Credit limit exceeded'))
          return
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to save invoice')))
    },
  })

  const customers = isSales
    ? ((metaQuery.data as { customers?: SalesInvoiceCustomer[] })?.customers ?? [])
    : []
  const suppliers = isPurchase
    ? ((metaQuery.data as { suppliers?: PurchaseInvoiceSupplier[] })?.suppliers ?? [])
    : []
  const customerOptions = useMemo(
    () => toCustomerLookupOptions(customers),
    [customers],
  )
  const supplierOptions = useMemo(
    () => toSupplierLookupOptions(suppliers),
    [suppliers],
  )
  const depots = metaQuery.data?.depots ?? []
  const paymentTermOptions = metaQuery.data?.payment_terms ?? []

  const selectedCustomerProfileId = useMemo(() => {
    if (!isSales || !customerUserId) {
      return null
    }
    const customer = customers.find((row) => String(row.id) === customerUserId)
    return customer?.customer_profile_id ?? null
  }, [isSales, customerUserId, customers])

  const selectedSupplierProfileId = useMemo(() => {
    if (!isPurchase || !supplierUserId) {
      return null
    }
    const supplier = suppliers.find((row) => String(row.id) === supplierUserId)
    return supplier?.supplier_profile_id ?? null
  }, [isPurchase, supplierUserId, suppliers])

  const excludeInvoiceId = isEdit && id ? Number(id) : undefined

  const applyPartyPaymentTerms = (partyPaymentTerms?: string | null) => {
    if (partyPaymentTerms) {
      form.setValue('payment_terms', partyPaymentTerms)
    }
  }

  const fieldError = (key: string) =>
    fieldErrors[key] || (form.formState.errors as Record<string, { message?: string }>)[key]?.message

  const loadingEdit = isEdit && invoiceQuery.isLoading

  if (loadingEdit) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isEdit && blockedNonDraftRef.current) {
    return null
  }

  return (
    <form
      onSubmit={form.handleSubmit((values: CommercialInvoiceFormValues) => {
        setFieldErrors({})

        if (isSales && values.type === 'product' && depotId) {
          const stockErrors = validateDepotStockQuantities(values.items, products, t)
          if (Object.keys(stockErrors).length > 0) {
            setFieldErrors(stockErrors)
            toast.error(
              t('The quantity entered is more than the available quantity in depot.'),
            )
            return
          }
        }

        saveMutation.mutate(values)
      })}
      className="mx-auto max-w-6xl space-y-6 p-6"
    >
      {isEdit && invoiceNumber ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('Invoice Number')}:</span>
          <span className="font-mono font-medium">{invoiceNumber}</span>
          <Badge variant="secondary">{t('Draft')}</Badge>
        </div>
      ) : null}

      {isSales ? (
        <SalesInvoiceCreditLimitAlert
          customerProfileId={selectedCustomerProfileId}
          paymentTerms={paymentTerms}
          paymentTermOptions={paymentTermOptions}
          proposedAmount={totals.total}
          excludeInvoiceId={excludeInvoiceId}
        />
      ) : (
        <PurchaseInvoiceCreditLimitAlert
          supplierProfileId={selectedSupplierProfileId}
          paymentTerms={paymentTerms}
          paymentTermOptions={paymentTermOptions}
          proposedAmount={totals.total}
          excludeInvoiceId={excludeInvoiceId}
        />
      )}

      <Card className={commercialDetailHeaderCardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            {isSales
              ? t('Sales Invoice Details')
              : t('Purchase Invoice Details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>{isPurchase ? t('PO Date') : t('Invoice Date')} *</Label>
            <Input type="date" {...form.register('invoice_date')} />
            <InputError message={fieldError('invoice_date')} />
          </div>
          <div className="space-y-2">
            <Label>{t('Due Date')} *</Label>
            <Input type="date" {...form.register('due_date')} />
            <InputError message={fieldError('due_date')} />
          </div>

          {isSales ? (
            <div className="space-y-2">
              <Label>{t('Customer')} *</Label>
              <EntitySelect
                value={form.watch('customer_id') || ''}
                onValueChange={(value) => {
                  form.setValue('customer_id', value)
                  const customer = customers.find((row) => String(row.id) === value)
                  applyPartyPaymentTerms(customer?.payment_terms)
                }}
                options={customerOptions}
                placeholder={t('Select Customer')}
                required
              />
              <InputError message={fieldError('customer_id')} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('Supplier')} *</Label>
              <EntitySelect
                value={form.watch('supplier_id') || ''}
                onValueChange={(value) => {
                  form.setValue('supplier_id', value)
                  const supplier = suppliers.find((row) => String(row.id) === value)
                  applyPartyPaymentTerms(supplier?.payment_terms)
                }}
                options={supplierOptions}
                placeholder={t('Select Supplier')}
                required
              />
              <InputError message={fieldError('supplier_id')} />
            </div>
          )}

          {isSales ? (
            <div className="space-y-2">
              <Label>{t('Depot')} *</Label>
              <Select value={depotId || undefined} onValueChange={handleDepotChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Depot')} />
                </SelectTrigger>
                <SelectContent>
                  {depots.map((depot) => (
                    <SelectItem key={depot.id} value={String(depot.id)}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError message={fieldError('depot_id')} />
            </div>
          ) : null}

          {isPurchase ? (
            <>
              <div className="space-y-2">
                <Label>{t('Depot')} *</Label>
                <Select value={depotId || undefined} onValueChange={handleDepotChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select Depot')} />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={String(depot.id)}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={fieldError('depot_id')} />
              </div>
              <div className="space-y-2">
                <Label>{t('Loading depot')}</Label>
                <Select
                  value={form.watch('loading_depot_id') || undefined}
                  onValueChange={(value) => form.setValue('loading_depot_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select loading depot')} />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map((depot) => (
                      <SelectItem key={`loading-${depot.id}`} value={String(depot.id)}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={fieldError('loading_depot_id')} />
              </div>
            </>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label>{t('Payment Terms')}</Label>
            <PaymentTermsSelect
              value={form.watch('payment_terms')}
              options={paymentTermOptions}
              onChange={(value) => form.setValue('payment_terms', value)}
              placeholder={t('e.g., Net 30')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('Notes')}</Label>
            <Textarea {...form.register('notes')} rows={2} placeholder={t('Additional notes...')} />
          </div>
        </CardContent>
      </Card>

      <Card className={commercialItemsPanelCardClass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              {isSales ? t('Sales Invoice Items') : t('Purchase Invoice Items')}
            </CardTitle>
            {!singleLineItems ? (
              <Button
                type="button"
                size="sm"
                onClick={() => form.setValue('items', [...items, emptyItem()])}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('Add Item')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <InvoiceItemsTable
            items={items}
            products={products}
            invoiceType={isSales ? 'product' : invoiceType}
            depotSelected={Boolean(depotId)}
            showAddButton={false}
            maxItems={singleLineItems ? 1 : undefined}
            errors={fieldErrors}
            onChange={(next) => form.setValue('items', next)}
          />
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="w-80 rounded-lg bg-muted/30 p-4">
              <h3 className="mb-3 font-semibold">{t('Invoice Summary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Discount')}</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(totals.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Tax')}</span>
                  <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">{t('Total')}</span>
                  <span className="font-bold">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {t('items added')}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(indexPath)}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending || items.length === 0}>
            {saveMutation.isPending
              ? isEdit
                ? t('Updating...')
                : t('Creating...')
              : isEdit
                ? t('Update')
                : t('Create')}
          </Button>
        </div>
      </div>
    </form>
  )
}
