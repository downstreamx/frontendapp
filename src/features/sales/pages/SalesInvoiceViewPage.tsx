import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Download, Edit, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { formatQuantity } from '@/lib/format-quantity'
import { balanceDueAmountClassName } from '@/lib/commercial-invoice-balance-due'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { postInvoice } from '@/features/commercial/api'
import { SalesInvoicePrintLayout } from '../components/sales-invoice-print-layout'
import {
  deleteSalesInvoice,
  fetchSalesInvoice,
  fetchSalesInvoiceCreateMeta,
} from '../sales-invoices-api'
import {
  SalesInvoiceCreditLimitAlert,
  useSalesInvoiceCreditBlocked,
} from '@/features/commercial/components/SalesInvoiceCreditLimitAlert'
import {
  canDeleteSalesInvoice,
  salesInvoiceDeleteMessage,
} from '../sales-invoice-delete'
import type { SalesInvoiceAddress, SalesInvoiceLineItem } from '../sales-invoice-view-types'
import { getSalesInvoiceStatusBadgeClasses } from '../sales-invoice-utils'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'
import { SalesInvoiceBridgingPanel } from '@/features/bridging/components/SalesInvoiceBridgingPanel'
import { shouldShowTruckLoadPanel } from '@/lib/commercial-invoice-operational'
import { SalesInvoiceDistributionNextStep } from '@/features/bridging/components/SalesInvoiceDistributionNextStep'
import {
  commercialDetailHeaderCardClass,
  commercialItemsPanelCardClass,
} from '@/features/commercial/commercial-page-styles'

function AddressBlock({ address, title }: { address?: SalesInvoiceAddress | null; title: string }) {
  if (!address) return null
  return (
    <div className="mt-3">
      <div className="mb-1 text-sm font-medium">{title}</div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {address.name ? <div>{address.name}</div> : null}
        {address.address_line_1 ? <div>{address.address_line_1}</div> : null}
        {(address.city || address.state || address.zip_code) && (
          <div>
            {[address.city, address.state].filter(Boolean).join(', ')} {address.zip_code}
          </div>
        )}
      </div>
    </div>
  )
}

function LineItemsTable({
  items,
  invoiceType,
}: {
  items: SalesInvoiceLineItem[]
  invoiceType: 'product' | 'service'
}) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')}</th>
            {invoiceType === 'product' ? (
              <th className="px-4 py-3 text-right text-sm font-semibold">{t('Qty')}</th>
            ) : null}
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Unit Price')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Discount')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Tax')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Total')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-4">
                <div className="font-medium">{item.product?.name ?? '—'}</div>
                {item.product?.sku ? (
                  <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                ) : null}
                {item.product?.description ? (
                  <div className="mt-1 text-sm text-muted-foreground">{item.product.description}</div>
                ) : null}
              </td>
              {invoiceType === 'product' ? (
                <td className="px-4 py-4 text-right">{formatQuantity(item.quantity)}</td>
              ) : null}
              <td className="px-4 py-4 text-right">{formatCurrency(item.unit_price)}</td>
              <td className="px-4 py-4 text-right">
                {item.discount_percentage > 0 ? (
                  <div>
                    <div>{item.discount_percentage}%</div>
                    <div className="text-sm text-muted-foreground">
                      -{formatCurrency(item.discount_amount)}
                    </div>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-4 text-right">
                {item.taxes && item.taxes.length > 0 ? (
                  <div>
                    {item.taxes.map((tax, index) => (
                      <div key={index} className="text-sm">
                        {tax.tax_name} ({tax.tax_rate}%)
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(item.tax_amount)}
                    </div>
                  </div>
                ) : item.tax_percentage > 0 ? (
                  <div>
                    <div>{item.tax_percentage}%</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(item.tax_amount)}
                    </div>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-4 text-right font-semibold">
                {formatCurrency(item.total_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SalesInvoiceViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [creditPostError, setCreditPostError] = useState<string | null>(null)
  const { auth, companyAllSetting } = useAppContext()
  const isPrintMode = searchParams.get('print') === '1'
  const downloadPdf = searchParams.get('download') === 'pdf'

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-sales-invoices')
  const canPost = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'post-sales-invoices')
  const canPrint = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'print-sales-invoices')

  const invoiceQuery = useQuery({
    queryKey: queryKeys.sales.invoices.detail(id!),
    queryFn: () => fetchSalesInvoice(id!),
    enabled: Boolean(id),
  })

  const invoice = invoiceQuery.data
  const isDraft = invoice?.status === 'draft'
  const showTruckLoadPanel = invoice ? shouldShowTruckLoadPanel(invoice.status) : false

  const metaQuery = useQuery({
    queryKey: queryKeys.sales.invoices.createMeta(),
    queryFn: fetchSalesInvoiceCreateMeta,
    enabled: isDraft,
  })

  const customerProfileId = useMemo(() => {
    if (!invoice) {
      return null
    }
    const match = metaQuery.data?.customers.find((row) => row.id === invoice.customer_id)
    return match?.customer_profile_id ?? null
  }, [invoice, metaQuery.data?.customers])

  const paymentTermOptions = metaQuery.data?.payment_terms ?? []

  const creditPostBlocked = useSalesInvoiceCreditBlocked(
    customerProfileId,
    invoice?.payment_terms ?? '',
    paymentTermOptions,
    invoice?.balance_amount ?? invoice?.total_amount ?? 0,
    invoice?.id,
  )

  useSalesPageChrome(
    invoice
      ? `${t('Sales Invoice')} #${invoice.invoice_number}`
      : t('Sales Invoice Details'),
    t('Sales Invoices'),
    { centerPageTitle: true },
  )

  const postMutation = useMutation({
    mutationFn: () => postInvoice('sales', id!),
    onSuccess: () => {
      setCreditPostError(null)
      toast.success(t('The sales invoice has been posted successfully.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.detail(id!) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.all() })
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { message?: string; code?: string } | undefined
        if (
          payload?.code === 'credit_limit_required' ||
          payload?.code === 'credit_limit_exceeded'
        ) {
          setCreditPostError(payload.message ?? t('Credit limit exceeded'))
          toast.error(payload.message ?? t('Credit limit exceeded'))
          return
        }
      }
      setCreditPostError(null)
      toast.error(getApiErrorMessage(error, t('Failed to post invoice')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSalesInvoice(id!),
    onSuccess: () => {
      toast.success(t('The sales invoice has been deleted.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.all() })
      navigate(paths.sales.invoices)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to delete invoice'))),
  })

  const statusLabel = (status: string) => t(status.charAt(0).toUpperCase() + status.slice(1))

  if (invoiceQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (invoiceQuery.error || !invoice) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-destructive">{t('Failed to load sales invoice.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.sales.invoices}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  if (isPrintMode) {
    return (
      <SalesInvoicePrintLayout
        invoice={invoice}
        companySettings={companyAllSetting}
        autoPrint={!downloadPdf}
        downloadPdf={downloadPdf}
      />
    )
  }

  const billing = invoice.customer_details?.billing_address
  const shipping = invoice.customer_details?.shipping_address
  const allocations = invoice.payment_allocations ?? []
  const dueDatePast = new Date(invoice.due_date) < new Date()

  const openPrint = () => {
    window.open(`${paths.sales.invoices}/${invoice.id}?print=1`, '_blank')
  }

  const downloadPdfFile = () => {
    window.open(`${paths.sales.invoices}/${invoice.id}?print=1&download=pdf`, '_blank')
  }

  const showDelete = canDeleteSalesInvoice(
    invoice,
    auth.permissions,
    auth.roles,
    auth.user?.type,
  )

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {isDraft ? (
          <SalesInvoiceCreditLimitAlert
            customerProfileId={customerProfileId}
            paymentTerms={invoice.payment_terms ?? ''}
            paymentTermOptions={paymentTermOptions}
            proposedAmount={invoice.balance_amount ?? invoice.total_amount}
            excludeInvoiceId={invoice.id}
          />
        ) : null}
        {creditPostError ? (
          <p className="text-sm text-destructive">{creditPostError}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={paths.sales.invoices}>{t('Back')}</Link>
            </Button>
            {isDraft && canEdit ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`${paths.sales.invoices}/${invoice.id}/edit`}>
                  <Edit className="mr-1 h-4 w-4" />
                  {t('Edit')}
                </Link>
              </Button>
            ) : null}
            {showDelete ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {t('Delete')}
              </Button>
            ) : null}
          </div>
        </div>

        <Card className={commercialDetailHeaderCardClass}>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg text-muted-foreground">#{invoice.invoice_number}</p>
              <div className="flex items-center gap-4">
                <span className={getSalesInvoiceStatusBadgeClasses(invoice.display_status)}>
                  {statusLabel(invoice.display_status)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</div>
                  <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 gap-6 ${
                billing || shipping ? 'md:grid-cols-3' : 'md:grid-cols-2'
              }`}
            >
              <div>
                <h3 className="mb-2 font-semibold">{t('CUSTOMER')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{invoice.customer?.name}</div>
                  {invoice.customer?.email ? (
                    <div className="text-muted-foreground">{invoice.customer.email}</div>
                  ) : null}
                  {invoice.customer?.company_name ? (
                    <div className="text-muted-foreground">{invoice.customer.company_name}</div>
                  ) : null}
                </div>
                <AddressBlock address={billing} title={t('Billing Address')} />
              </div>

              {shipping ? (
                <div>
                  <h3 className="mb-2 font-semibold">{t('SHIPPING ADDRESS')}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {shipping.name ? <div>{shipping.name}</div> : null}
                    {shipping.address_line_1 ? <div>{shipping.address_line_1}</div> : null}
                    {(shipping.city || shipping.state || shipping.zip_code) && (
                      <div>
                        {[shipping.city, shipping.state].filter(Boolean).join(', ')}{' '}
                        {shipping.zip_code}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="mb-2 font-semibold">{t('DETAILS')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Invoice Date')}</span>
                    <span>{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Due Date')}</span>
                    <span className={dueDatePast ? 'text-destructive' : ''}>
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                  {invoice.type === 'product' && invoice.depot ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Depot')}</span>
                      <span>{invoice.depot.name}</span>
                    </div>
                  ) : null}
                  {invoice.payment_terms ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Terms')}</span>
                      <span>{invoice.payment_terms}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {canPrint ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={openPrint}>
                            <FileText className="mr-2 h-4 w-4" />
                            {t('Print')}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={downloadPdfFile}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Download PDF')}
                          </Button>
                        </>
                      ) : null}
                      {isDraft && canPost ? (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              disabled={postMutation.isPending || creditPostBlocked}
                              onClick={() => postMutation.mutate()}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {postMutation.isPending ? t('Posting...') : t('Post Invoice')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('Post invoice to finalize and create journal entries')}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          'text-lg font-bold sm:text-xl',
                          balanceDueAmountClassName(invoice) || 'text-primary',
                        )}
                      >
                        {formatCurrency(invoice.balance_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        {t('Balance Due')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {invoice.notes ? (
              <div className="mt-4 border-t pt-4">
                <span className="text-sm font-medium">{t('Notes')}:</span>
                <span className="ml-2 text-sm text-muted-foreground">{invoice.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={commercialItemsPanelCardClass}>
          <CardHeader>
            <CardTitle className="text-lg">{t('Invoice Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable items={invoice.items ?? []} invoiceType={invoice.type} />
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Discount')}</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(invoice.discount_amount)}
                    </span>
                  </div>
                ) : null}
                {invoice.tax_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Tax')}</span>
                    <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('Total Amount')}</span>
                  <span className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.paid_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Paid Amount')}</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(invoice.paid_amount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="font-semibold">{t('Balance Due')}</span>
                  <span
                    className={cn('text-lg font-bold', balanceDueAmountClassName(invoice))}
                  >
                    {formatCurrency(invoice.balance_amount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showTruckLoadPanel ? (
          <>
            <SalesInvoiceDistributionNextStep
              invoiceId={invoice.id}
              paidAmount={invoice.paid_amount}
              enabled={showTruckLoadPanel}
            />
            <SalesInvoiceBridgingPanel
              invoiceId={invoice.id}
              depotId={invoice.depot?.id}
              invoiceStatus={invoice.status}
              paidAmount={invoice.paid_amount}
            />
          </>
        ) : null}

        {allocations.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Payments Applied')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold">{t('Payment')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('Date')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('Status')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('Allocated')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allocations.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          {row.payment?.id ? (
                            <Link
                              to={paths.account.customerPayments.show(row.payment.id)}
                              className="text-primary hover:underline"
                            >
                              {row.payment.payment_number ?? `#${row.payment.id}`}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.payment?.payment_date
                            ? formatDate(row.payment.payment_date)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.payment?.status
                            ? statusLabel(row.payment.status)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(row.allocated_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete Sales Invoice')}
        message={salesInvoiceDeleteMessage(invoice, t)}
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
