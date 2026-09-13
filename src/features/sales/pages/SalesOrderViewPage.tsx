import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, Edit, FileText, RefreshCw, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { SalesOrderPrintLayout } from '../components/sales-order-print-layout'
import {
  commercialDetailHeaderCardClass,
  commercialItemsPanelCardClass,
} from '@/features/commercial/commercial-page-styles'
import {
  acceptSalesOrder,
  convertSalesOrderToInvoice,
  deleteSalesOrder,
  fetchSalesOrder,
  rejectSalesOrder,
  sendSalesOrder,
} from '../sales-orders-api'
import { canDeleteSalesOrder, salesOrderDeleteMessage } from '../sales-order-delete'
import type { SalesOrderAddress, SalesOrderLineItem } from '../sales-order-view-types'
import { getSalesOrderStatusBadgeClasses } from '../sales-order-utils'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'

function AddressBlock({ address, title }: { address?: SalesOrderAddress | null; title: string }) {
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

function LineItemsTable({ items }: { items: SalesOrderLineItem[] }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Qty')}</th>
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
              <td className="px-4 py-4 text-right">{item.quantity}</td>
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

export function SalesOrderViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { auth, companyAllSetting } = useAppContext()
  const isPrintMode = searchParams.get('print') === '1'
  const downloadPdf = searchParams.get('download') === 'pdf'

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-sales-proposals',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-sales-proposals',
  )
  const canSend = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'sent-sales-proposals',
  )
  const canAccept = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'accept-sales-proposals',
  )
  const canReject = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'reject-sales-proposals',
  )
  const canConvert = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'convert-sales-proposals',
  )
  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-sales-proposals',
  )

  const proposalQuery = useQuery({
    queryKey: queryKeys.sales.orders.detail(id!),
    queryFn: () => fetchSalesOrder(id!),
    enabled: Boolean(id),
  })

  const proposal = proposalQuery.data
  const isDraft = proposal?.status === 'draft'
  const isSent = proposal?.status === 'sent'
  const isAccepted = proposal?.status === 'accepted'

  useSalesPageChrome(
    proposal
      ? `${t('Sales Order')} #${proposal.proposal_number}`
      : t('Sales Order Details'),
    t('Sales Orders'),
    { centerPageTitle: true },
  )

  const invalidateProposal = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.detail(id!) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.all() })
  }

  const sendMutation = useMutation({
    mutationFn: () => sendSalesOrder(id!),
    onSuccess: () => {
      toast.success(t('The sales order has been sent.'))
      invalidateProposal()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to send sales order'))),
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptSalesOrder(id!),
    onSuccess: () => {
      toast.success(t('The sales order has been accepted.'))
      invalidateProposal()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to accept sales order'))),
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectSalesOrder(id!),
    onSuccess: () => {
      toast.success(t('The sales order has been rejected.'))
      invalidateProposal()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to reject sales order'))),
  })

  const convertMutation = useMutation({
    mutationFn: () => convertSalesOrderToInvoice(id!),
    onSuccess: (data) => {
      toast.success(t('The sales order has been converted to an invoice.'))
      invalidateProposal()
      navigate(`${paths.sales.invoices}/${data.id}`)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t('Failed to convert sales order to invoice'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSalesOrder(id!),
    onSuccess: () => {
      toast.success(t('The sales order has been deleted.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.all() })
      navigate(paths.sales.orders)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to delete sales order'))),
  })

  const statusLabel = (status: string) => t(status.charAt(0).toUpperCase() + status.slice(1))

  if (proposalQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (proposalQuery.error || !proposal) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-destructive">{t('Failed to load sales order.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.sales.orders}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  if (isPrintMode) {
    return (
      <SalesOrderPrintLayout
        proposal={proposal}
        companySettings={companyAllSetting}
        autoPrint={!downloadPdf}
        downloadPdf={downloadPdf}
      />
    )
  }

  const billing = proposal.customer_details?.billing_address
  const dueDatePast = proposal.due_date ? new Date(proposal.due_date) < new Date() : false

  const openPrint = () => {
    window.open(`${paths.sales.orderShow(proposal.id)}?print=1`, '_blank')
  }

  const downloadPdfFile = () => {
    window.open(`${paths.sales.orderShow(proposal.id)}?print=1&download=pdf`, '_blank')
  }

  const showDelete = canDeleteSalesOrder(
    proposal,
    auth.permissions,
    auth.roles,
    auth.user?.type,
  )

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={paths.sales.orders}>{t('Back')}</Link>
            </Button>
            {isDraft && canEdit && !proposal.converted_to_invoice ? (
              <Button asChild size="sm" variant="outline">
                <Link to={paths.sales.orderEdit(proposal.id)}>
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
            {isDraft && canSend ? (
              <Button
                type="button"
                size="sm"
                disabled={sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                <Send className="mr-1 h-4 w-4" />
                {sendMutation.isPending ? t('Sending...') : t('Send')}
              </Button>
            ) : null}
            {isSent && canAccept ? (
              <Button
                type="button"
                size="sm"
                disabled={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate()}
              >
                <Check className="mr-1 h-4 w-4" />
                {acceptMutation.isPending ? t('Accepting...') : t('Accept')}
              </Button>
            ) : null}
            {isSent && canReject ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                <X className="mr-1 h-4 w-4" />
                {rejectMutation.isPending ? t('Rejecting...') : t('Reject')}
              </Button>
            ) : null}
            {isAccepted && canConvert && !proposal.converted_to_invoice ? (
              <Button
                type="button"
                size="sm"
                disabled={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                {convertMutation.isPending ? t('Converting...') : t('Convert to Invoice')}
              </Button>
            ) : null}
            {proposal.converted_to_invoice && proposal.invoice_id ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`${paths.sales.invoices}/${proposal.invoice_id}`}>
                  <FileText className="mr-1 h-4 w-4" />
                  {t('View Invoice')}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Card className={commercialDetailHeaderCardClass}>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg text-muted-foreground">#{proposal.proposal_number}</p>
              <div className="flex items-center gap-4">
                <span className={getSalesOrderStatusBadgeClasses(proposal.display_status)}>
                  {statusLabel(proposal.display_status)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(proposal.total_amount)}</div>
                  <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 gap-6 ${
                billing ? 'md:grid-cols-2' : 'md:grid-cols-1'
              }`}
            >
              <div>
                <h3 className="mb-2 font-semibold">{t('CUSTOMER')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{proposal.customer?.name}</div>
                  {proposal.customer?.email ? (
                    <div className="text-muted-foreground">{proposal.customer.email}</div>
                  ) : null}
                  {proposal.customer?.company_name ? (
                    <div className="text-muted-foreground">{proposal.customer.company_name}</div>
                  ) : null}
                </div>
                <AddressBlock address={billing} title={t('Billing Address')} />
              </div>

              <div>
                <h3 className="mb-2 font-semibold">{t('DETAILS')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Order Date')}</span>
                    <span>{formatDate(proposal.proposal_date)}</span>
                  </div>
                  {proposal.due_date ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Due Date')}</span>
                      <span className={dueDatePast ? 'text-destructive' : ''}>
                        {formatDate(proposal.due_date)}
                      </span>
                    </div>
                  ) : null}
                  {proposal.depot ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Depot')}</span>
                      <span>{proposal.depot.name}</span>
                    </div>
                  ) : null}
                  {proposal.payment_terms ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Terms')}</span>
                      <span>{proposal.payment_terms}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  {canPrint ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={openPrint}>
                        <FileText className="mr-2 h-4 w-4" />
                        {t('Print')}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={downloadPdfFile}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('Download PDF')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {proposal.notes ? (
              <div className="mt-4 border-t pt-4">
                <span className="text-sm font-medium">{t('Notes')}:</span>
                <span className="ml-2 text-sm text-muted-foreground">{proposal.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={commercialItemsPanelCardClass}>
          <CardHeader>
            <CardTitle className="text-lg">{t('Order Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable items={proposal.items ?? []} />
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
                </div>
                {proposal.discount_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Discount')}</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(proposal.discount_amount)}
                    </span>
                  </div>
                ) : null}
                {proposal.tax_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Tax')}</span>
                    <span className="font-medium">{formatCurrency(proposal.tax_amount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('Total Amount')}</span>
                  <span className="text-lg font-bold">{formatCurrency(proposal.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete Sales Order')}
        message={salesOrderDeleteMessage(proposal, t)}
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
