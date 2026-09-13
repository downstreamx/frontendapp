import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { toCustomerLookupOptions } from '@/features/_shared/operations-lookups'
import { Separator } from '@/components/ui/separator'
import InputError from '@/components/ui/input-error'
import { PaymentTermsSelect } from '@/components/setup/PaymentTermsSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { validateDepotStockQuantities } from '@/features/commercial/depot-stock-validation'
import { buildSalesOrderFormSchema } from '@/features/commercial/schemas'
import {
  commercialDetailHeaderCardClass,
  commercialItemsPanelCardClass,
} from '@/features/commercial/commercial-page-styles'
import type { CommercialProduct } from '@/features/commercial/types'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { createZodResolver } from '@/lib/form/zod-resolver'
import { getApiErrorMessage, mapApiValidationErrors } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import {
  createSalesOrder,
  fetchSalesOrder,
  fetchSalesOrderCreateMeta,
  fetchSalesOrderDepotProducts,
  updateSalesOrder,
} from '../sales-orders-api'
import { buildSalesOrderPayload } from '../sales-order-payload'
import {
  mapSalesOrderToFormValues,
  type SalesOrderFormValues,
} from '../sales-order-form-utils'

const emptyItem = (): SalesOrderFormValues['items'][0] => ({
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_percentage: 0,
  discount_amount: 0,
  tax_percentage: 0,
  tax_amount: 0,
  total_amount: 0,
})

const defaultValues: SalesOrderFormValues = {
  proposal_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  customer_id: '',
  depot_id: '',
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

function flattenItemFormErrors(errors: FieldErrors<SalesOrderFormValues>): Record<string, string> {
  const result: Record<string, string> = {}
  if (errors.items?.message) {
    result.items = String(errors.items.message)
  }
  if (Array.isArray(errors.items)) {
    errors.items.forEach((item, index) => {
      if (item?.quantity?.message) {
        result[`items.${index}.quantity`] = String(item.quantity.message)
      }
    })
  }
  return result
}

export function SalesOrderEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [products, setProducts] = useState<CommercialProduct[]>([])
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({})
  const [proposalNumber, setProposalNumber] = useState<string | null>(null)
  const blockedEditRef = useRef(false)

  const metaQuery = useQuery({
    queryKey: queryKeys.sales.orders.createMeta(),
    queryFn: fetchSalesOrderCreateMeta,
  })

  const singleLineOrder =
    metaQuery.data?.line_item_settings?.single_line_sales_order ?? true

  const orderSchema = useMemo(
    () =>
      buildSalesOrderFormSchema({ singleLine: singleLineOrder }).superRefine((values, ctx) => {
        const validItems = values.items.filter((item) => item.product_id > 0)
        if (validItems.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('At least one line item with a product is required.'),
            path: ['items'],
          })
        }
        if (values.depot_id) {
          const stockErrors = validateDepotStockQuantities(values.items, products, t)
          for (const [key, message] of Object.entries(stockErrors)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message,
              path: key.split('.'),
            })
          }
        }
        if (singleLineOrder && values.items.length > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('Only one line item is allowed per sales order.'),
            path: ['items'],
          })
        }
      }),
    [products, singleLineOrder, t],
  )

  const form = useForm<SalesOrderFormValues>({
    resolver: createZodResolver(orderSchema),
    defaultValues,
  })

  const items = form.watch('items')
  const depotId = form.watch('depot_id')
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

  const pageTitle = isEdit ? t('Edit Sales Order') : t('Create Sales Order')

  usePageChrome({
    pageTitle,
    centerPageTitle: !isEdit,
    breadcrumbs: [
      { label: t('Sales'), url: paths.sales.orders },
      { label: t('Sales Orders'), url: paths.sales.orders },
      { label: pageTitle },
    ],
  })

  const proposalQuery = useQuery({
    queryKey: queryKeys.sales.orders.detail(id!),
    enabled: isEdit && Boolean(id),
    queryFn: () => fetchSalesOrder(id!),
  })

  useEffect(() => {
    if (!isEdit || !proposalQuery.data) return

    const row = proposalQuery.data
    const cannotEdit = row.status !== 'draft' || row.converted_to_invoice

    if (cannotEdit) {
      if (!blockedEditRef.current) {
        blockedEditRef.current = true
        toast.error(t('Only draft sales orders that have not been converted can be edited.'))
        navigate(paths.sales.orderShow(row.id), { replace: true })
      }
      return
    }

    setProposalNumber(row.proposal_number)
    form.reset(mapSalesOrderToFormValues(row))
  }, [proposalQuery.data, isEdit, form, navigate, t])

  useEffect(() => {
    if (isEdit && !proposalQuery.data) return

    const loadProducts = async () => {
      if (!depotId) {
        setProducts([])
        return
      }

      const includeProductIds = selectedProductIds
        ? selectedProductIds.split(',').map((id) => Number(id))
        : []

      const rows = await fetchSalesOrderDepotProducts(depotId, { includeProductIds })
      setProducts(rows as CommercialProduct[])
    }

    void loadProducts()
  }, [isEdit, depotId, proposalQuery.data, selectedProductIds])

  useEffect(() => {
    if (!singleLineOrder || items.length <= 1) return
    form.setValue('items', items.slice(0, 1))
  }, [singleLineOrder, items, form])

  const handleDepotChange = (value: string) => {
    form.setValue('depot_id', value)
    if (!isEdit) {
      form.setValue('items', [emptyItem()])
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (values: SalesOrderFormValues) => {
      const body = buildSalesOrderPayload(values, {
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
      })
      if (isEdit && id) return updateSalesOrder(id, body)
      return createSalesOrder(body)
    },
    onSuccess: (data) => {
      toast.success(
        isEdit
          ? t('The sales proposal has been updated successfully.')
          : t('The sales proposal has been created successfully.'),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.all() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.detail(id!) })
      navigate(paths.sales.proposalShow(data.id))
    },
    onError: (error) => {
      const mapped = mapApiValidationErrors(error)
      if (Object.keys(mapped).length > 0) {
        setApiFieldErrors(mapped)
        for (const [field, message] of Object.entries(mapped)) {
          form.setError(field as keyof SalesOrderFormValues, { message })
        }
      } else if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          setApiFieldErrors(apiErrorsToFieldMap(payload.errors))
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to save proposal')))
    },
  })

  const customers = metaQuery.data?.customers ?? []
  const customerOptions = useMemo(
    () => toCustomerLookupOptions(customers),
    [customers],
  )
  const depots = metaQuery.data?.depots ?? []
  const paymentTermOptions = metaQuery.data?.payment_terms ?? []

  const fieldError = (key: string) =>
    apiFieldErrors[key] ??
    (form.formState.errors as Record<string, { message?: string }>)[key]?.message

  const itemErrors = useMemo(
    () => ({ ...flattenItemFormErrors(form.formState.errors), ...apiFieldErrors }),
    [form.formState.errors, apiFieldErrors],
  )

  const loadingEdit = isEdit && proposalQuery.isLoading

  if (loadingEdit) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isEdit && blockedEditRef.current) {
    return null
  }

  const onSubmit = form.handleSubmit(
    (values) => {
      setApiFieldErrors({})
      saveMutation.mutate(values)
    },
    (errors) => {
      const flat = flattenItemFormErrors(errors)
      if (Object.keys(flat).some((key) => key.includes('.quantity'))) {
        toast.error(t('The quantity entered is more than the available quantity in depot.'))
      }
    },
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto max-w-6xl space-y-6 p-6"
    >
      {isEdit && proposalNumber ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('Order Number')}:</span>
          <span className="font-mono font-medium">{proposalNumber}</span>
          <Badge variant="secondary">{t('Draft')}</Badge>
        </div>
      ) : null}

      <Card className={commercialDetailHeaderCardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            {t('Sales Order Details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>{t('Order Date')} *</Label>
            <Input type="date" {...form.register('proposal_date')} />
            <InputError message={fieldError('proposal_date')} />
          </div>
          <div className="space-y-2">
            <Label>{t('Due Date')}</Label>
            <Input type="date" {...form.register('due_date')} />
            <InputError message={fieldError('due_date')} />
          </div>

          <div className="space-y-2">
            <Label>{t('Customer')} *</Label>
            <EntitySelect
              value={form.watch('customer_id') || ''}
              onValueChange={(value) => {
                form.setValue('customer_id', value)
                const customer = customers.find((row) => String(row.id) === value)
                if (customer?.payment_terms) {
                  form.setValue('payment_terms', customer.payment_terms)
                }
              }}
              options={customerOptions}
              placeholder={t('Select Customer')}
              required
            />
            <InputError message={fieldError('customer_id')} />
          </div>

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
              {t('Order Items')}
            </CardTitle>
            {!singleLineOrder ? (
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
            invoiceType="product"
            depotSelected={Boolean(depotId)}
            showAddButton={false}
            maxItems={singleLineOrder ? 1 : undefined}
            errors={itemErrors}
            onChange={(next) => form.setValue('items', next)}
          />
          <InputError message={fieldError('items')} />
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="w-80 rounded-lg bg-muted/30 p-4">
              <h3 className="mb-3 font-semibold">{t('Order Summary')}</h3>
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
          <Button type="button" variant="outline" onClick={() => navigate(paths.sales.proposals)}>
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
        </div>
      </div>
    </form>
  )
}
