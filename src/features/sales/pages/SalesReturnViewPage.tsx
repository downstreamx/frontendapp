import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle, Edit, Info, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import {
  approveSalesReturn,
  completeSalesReturn,
  deleteSalesReturn,
  fetchSalesReturn,
} from '../sales-returns-api'
import { canDeleteSalesReturn, salesReturnDeleteMessage } from '../sales-return-delete'
import type { SalesReturnLineItem } from '../sales-return-view-types'
import { getSalesReturnStatusBadgeClasses } from '../sales-return-utils'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'

function LineItemsTable({ items }: { items: SalesReturnLineItem[] }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Return Qty')}</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">{t('Unit Price')}</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">{t('Reason')}</th>
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
              </td>
              <td className="px-4 py-4 text-right">{item.return_quantity}</td>
              <td className="px-4 py-4 text-right">{formatCurrency(item.unit_price)}</td>
              <td className="px-4 py-4">{item.reason || '—'}</td>
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

export function SalesReturnViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { auth } = useAppContext()

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-sales-return-invoices',
  )
  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-sales-returns-invoices',
  )
  const canComplete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'complete-sales-returns-invoices',
  )

  const returnQuery = useQuery({
    queryKey: ['sales-return', id],
    queryFn: () => fetchSalesReturn(id!),
    enabled: Boolean(id),
  })

  const salesReturn = returnQuery.data
  const isDraft = salesReturn?.status === 'draft'

  useSalesPageChrome(
    salesReturn
      ? `${t('Sales Return')} #${salesReturn.return_number}`
      : t('Sales Return Details'),
    t('Sales Returns'),
  )

  const approveMutation = useMutation({
    mutationFn: () => approveSalesReturn(id!),
    onSuccess: () => {
      toast.success(t('The sales return has been approved.'))
      void queryClient.invalidateQueries({ queryKey: ['sales-return', id] })
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to approve return'))),
  })

  const completeMutation = useMutation({
    mutationFn: () => completeSalesReturn(id!),
    onSuccess: () => {
      toast.success(t('The sales return has been completed.'))
      void queryClient.invalidateQueries({ queryKey: ['sales-return', id] })
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to complete return'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSalesReturn(id!),
    onSuccess: () => {
      toast.success(t('The sales return has been deleted.'))
      void queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      navigate(paths.sales.returns)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to delete return'))),
  })

  const statusLabel = (status: string) => t(status.charAt(0).toUpperCase() + status.slice(1))

  if (returnQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (returnQuery.error || !salesReturn) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-destructive">{t('Failed to load sales return.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.sales.returns}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  const billing = salesReturn.customer_details?.billing_address
  const showDelete = canDeleteSalesReturn(salesReturn, auth.permissions, auth.roles, auth.user?.type)

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.sales.returns}>{t('Back')}</Link>
          </Button>
          {isDraft && canEdit ? (
            <Button asChild size="sm" variant="outline">
              <Link to={paths.sales.returnEdit(salesReturn.id)}>
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

        <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p>
                {t(
                  'Approving this return creates a draft credit note. Accounting posts when the credit note is approved in Account — not when the return is approved.',
                )}
              </p>
              {salesReturn.credit_note ? (
                <p>
                  {t('Credit note')}:{' '}
                  <Link
                    to={paths.account.creditNotes.show(salesReturn.credit_note.id)}
                    className="font-medium text-primary hover:underline"
                  >
                    {salesReturn.credit_note.credit_note_number}
                  </Link>
                  {' — '}
                  {statusLabel(salesReturn.credit_note.status)}
                  {salesReturn.credit_note.status === 'draft'
                    ? ` (${t('approve in Account to post GL')})`
                    : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg text-muted-foreground">#{salesReturn.return_number}</p>
              <div className="flex items-center gap-4">
                <span className={getSalesReturnStatusBadgeClasses(salesReturn.status)}>
                  {statusLabel(salesReturn.status)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(salesReturn.total_amount)}</div>
                  <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">{t('CUSTOMER')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{salesReturn.customer?.name}</div>
                  {salesReturn.customer?.email ? (
                    <div className="text-muted-foreground">{salesReturn.customer.email}</div>
                  ) : null}
                </div>
                {billing ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {billing.name ? <div>{billing.name}</div> : null}
                    {billing.address_line_1 ? <div>{billing.address_line_1}</div> : null}
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">{t('DETAILS')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Return Date')}</span>
                    <span>{formatDate(salesReturn.return_date)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Depot')}</span>
                    <span>{salesReturn.depot?.name ?? '—'}</span>
                  </div>
                  {salesReturn.original_invoice ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Original Invoice')}</span>
                      <Link
                        to={paths.sales.invoices + `/${salesReturn.original_invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {salesReturn.original_invoice.invoice_number}
                      </Link>
                    </div>
                  ) : null}
                  {salesReturn.reason ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Return Reason')}</span>
                      <span>{salesReturn.reason}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  <div className="flex flex-wrap gap-2">
                    {isDraft && canApprove ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate()}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {approveMutation.isPending ? t('Approving...') : t('Approve Return')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('Approve this return')}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                    {salesReturn.status === 'approved' && canComplete ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={completeMutation.isPending}
                        onClick={() => completeMutation.mutate()}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {completeMutation.isPending ? t('Completing...') : t('Complete Return')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {salesReturn.notes ? (
              <div className="mt-4 border-t pt-4">
                <span className="text-sm font-medium">{t('Notes')}:</span>
                <span className="ml-2 text-sm text-muted-foreground">{salesReturn.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Return Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable items={salesReturn.items ?? []} />
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span>{formatCurrency(salesReturn.subtotal)}</span>
                </div>
                {salesReturn.discount_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Discount')}</span>
                    <span className="text-destructive">
                      -{formatCurrency(salesReturn.discount_amount)}
                    </span>
                  </div>
                ) : null}
                {salesReturn.tax_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Tax')}</span>
                    <span>{formatCurrency(salesReturn.tax_amount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('Total Amount')}</span>
                  <span className="text-lg font-bold">{formatCurrency(salesReturn.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete Sales Return')}
        message={salesReturnDeleteMessage(salesReturn, t)}
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
