import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle, Edit, Trash2 } from 'lucide-react'
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
  approvePurchaseReturn,
  completePurchaseReturn,
  deletePurchaseReturn,
  fetchPurchaseReturn,
} from '../purchase-returns-api'
import { canDeletePurchaseReturn, purchaseReturnDeleteMessage } from '../purchase-return-delete'
import type { PurchaseReturnLineItem } from '../purchase-return-view-types'
import { getPurchaseReturnStatusBadgeClasses } from '../purchase-return-utils'
import { usePurchasePageChrome } from '../hooks/use-purchase-page-chrome'

function LineItemsTable({ items }: { items: PurchaseReturnLineItem[] }) {
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

export function PurchaseReturnViewPage() {
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
    'edit-purchase-return-invoices',
  )
  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-purchase-returns-invoices',
  )
  const canComplete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'complete-purchase-returns-invoices',
  )

  const returnQuery = useQuery({
    queryKey: ['purchase-return', id],
    queryFn: () => fetchPurchaseReturn(id!),
    enabled: Boolean(id),
  })

  const purchaseReturn = returnQuery.data
  const isDraft = purchaseReturn?.status === 'draft'

  usePurchasePageChrome(
    purchaseReturn
      ? `${t('Purchase Return')} #${purchaseReturn.return_number}`
      : t('Purchase Return Details'),
    t('Purchase Returns'),
  )

  const approveMutation = useMutation({
    mutationFn: () => approvePurchaseReturn(id!),
    onSuccess: () => {
      toast.success(t('The purchase return has been approved.'))
      void queryClient.invalidateQueries({ queryKey: ['purchase-return', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to approve return'))),
  })

  const completeMutation = useMutation({
    mutationFn: () => completePurchaseReturn(id!),
    onSuccess: () => {
      toast.success(t('The purchase return has been completed.'))
      void queryClient.invalidateQueries({ queryKey: ['purchase-return', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to complete return'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePurchaseReturn(id!),
    onSuccess: () => {
      toast.success(t('The purchase return has been deleted.'))
      void queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      navigate(paths.purchase.returns)
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

  if (returnQuery.error || !purchaseReturn) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-destructive">{t('Failed to load purchase return.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.purchase.returns}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  const billing = purchaseReturn.supplier_details?.billing_address
  const showDelete = canDeletePurchaseReturn(purchaseReturn, auth.permissions, auth.roles, auth.user?.type)

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.purchase.returns}>{t('Back')}</Link>
          </Button>
          {isDraft && canEdit ? (
            <Button asChild size="sm" variant="outline">
              <Link to={paths.purchase.returnEdit(purchaseReturn.id)}>
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

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg text-muted-foreground">#{purchaseReturn.return_number}</p>
              <div className="flex items-center gap-4">
                <span className={getPurchaseReturnStatusBadgeClasses(purchaseReturn.status)}>
                  {statusLabel(purchaseReturn.status)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(purchaseReturn.total_amount)}</div>
                  <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">{t('SUPPLIER')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{purchaseReturn.supplier?.name}</div>
                  {purchaseReturn.supplier?.email ? (
                    <div className="text-muted-foreground">{purchaseReturn.supplier.email}</div>
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
                    <span>{formatDate(purchaseReturn.return_date)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('Depot')}</span>
                    <span>{purchaseReturn.depot?.name ?? '—'}</span>
                  </div>
                  {purchaseReturn.original_invoice ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Original Invoice')}</span>
                      <Link
                        to={paths.purchase.invoices + `/${purchaseReturn.original_invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {purchaseReturn.original_invoice.invoice_number}
                      </Link>
                    </div>
                  ) : null}
                  {purchaseReturn.reason ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('Return Reason')}</span>
                      <span>{purchaseReturn.reason}</span>
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
                    {purchaseReturn.status === 'approved' && canComplete ? (
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

            {purchaseReturn.notes ? (
              <div className="mt-4 border-t pt-4">
                <span className="text-sm font-medium">{t('Notes')}:</span>
                <span className="ml-2 text-sm text-muted-foreground">{purchaseReturn.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Return Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable items={purchaseReturn.items ?? []} />
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span>{formatCurrency(purchaseReturn.subtotal)}</span>
                </div>
                {purchaseReturn.discount_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Discount')}</span>
                    <span className="text-destructive">
                      -{formatCurrency(purchaseReturn.discount_amount)}
                    </span>
                  </div>
                ) : null}
                {purchaseReturn.tax_amount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Tax')}</span>
                    <span>{formatCurrency(purchaseReturn.tax_amount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('Total Amount')}</span>
                  <span className="text-lg font-bold">{formatCurrency(purchaseReturn.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete Purchase Return')}
        message={purchaseReturnDeleteMessage(purchaseReturn, t)}
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
