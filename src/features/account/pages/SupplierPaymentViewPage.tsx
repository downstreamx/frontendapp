import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import {
  deleteSupplierPayment,
  getSupplierPayment,
  updateSupplierPaymentStatus,
} from '../payments-api'
import {
  canDeleteSupplierPayment,
  supplierPaymentDeleteMessage,
} from '../supplier-payment-delete'
import { PaymentStatusBadge } from '../components/PaymentStatusBadge'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'

export function SupplierPaymentViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const { auth } = useAppContext()

  const canClear = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'cleared-supplier-payments',
  )

  const paymentQuery = useQuery({
    queryKey: queryKeys.account.payments.supplier.detail(id!),
    queryFn: () => getSupplierPayment(id!),
    enabled: Boolean(id),
  })

  const payment = paymentQuery.data
  const isPending = payment?.status === 'pending'
  const isCleared = payment?.status === 'cleared'

  useAccountPageChrome(
    payment
      ? `${t('Payment')} #${payment.payment_number ?? payment.id}`
      : t('Payment details'),
    t('Supplier payments'),
  )

  const statusMutation = useMutation({
    mutationFn: (status: 'cleared' | 'cancelled' | 'voided') =>
      updateSupplierPaymentStatus(id!, status),
    onSuccess: (_, status) => {
      toast.success(
        status === 'cleared'
          ? t('Payment marked as cleared.')
          : status === 'voided'
            ? t('Payment voided. GL and bill allocations were reversed.')
            : t('Payment cancelled.'),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.payments.supplier.detail(id!) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.payments.supplier.all() })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update payment status'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplierPayment(id!),
    onSuccess: () => {
      toast.success(t('The supplier payment has been deleted.'))
      void queryClient.invalidateQueries({ queryKey: ['supplier-payments'] })
      navigate(paths.account.supplierPayments.index)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete payment'))),
  })

  if (paymentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (paymentQuery.error || !payment) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-destructive">{t('Payment not found.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.account.supplierPayments.index}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  const debitApps =
    payment.debit_note_applications ?? payment.debitNoteApplications ?? []
  const totalDebitApplied = debitApps.reduce(
    (sum, app) => sum + Number(app.applied_amount),
    0,
  )
  const showDelete = canDeleteSupplierPayment(
    payment,
    auth.permissions,
    auth.roles,
    auth.user?.type,
  )

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {t('Payment details')} — {payment.payment_number ?? `#${payment.id}`}
            </h1>
            <div className="mt-2">
              <PaymentStatusBadge status={payment.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={paths.account.supplierPayments.index}>{t('Back to list')}</Link>
            </Button>
            {isPending && canClear ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate('cleared')}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t('Mark as Cleared')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate('cancelled')}
                >
                  <X className="mr-1 h-4 w-4" />
                  {t('Cancel Payment')}
                </Button>
              </>
            ) : null}
            {isCleared && canClear ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={statusMutation.isPending}
                onClick={() => setVoidOpen(true)}
              >
                {t('Void payment')}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Payment information')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="font-semibold">{t('Payment number')}</span>
                <p className="mt-1 text-muted-foreground">
                  {payment.payment_number ?? `#${payment.id}`}
                </p>
              </div>
              <div>
                <span className="font-semibold">{t('Payment date')}</span>
                <p className="mt-1 text-muted-foreground">{formatDate(payment.payment_date)}</p>
              </div>
              <div>
                <span className="font-semibold">{t('Supplier')}</span>
                <p className="mt-1 text-muted-foreground">{payment.supplier?.name ?? '—'}</p>
              </div>
              <div>
                <span className="font-semibold">{t('Bank account')}</span>
                <p className="mt-1 text-muted-foreground">
                  {payment.bank_account?.account_name ?? '—'}
                  {payment.bank_account?.account_number
                    ? ` (${payment.bank_account.account_number})`
                    : ''}
                </p>
              </div>
              <div>
                <span className="font-semibold">{t('Payment amount')}</span>
                <p className="mt-1 text-lg font-bold text-green-600">
                  {formatCurrency(Number(payment.payment_amount))}
                </p>
              </div>
              {payment.reference_number ? (
                <div>
                  <span className="font-semibold">{t('Reference number')}</span>
                  <p className="mt-1 text-muted-foreground">{payment.reference_number}</p>
                </div>
              ) : null}
              {payment.created_at ? (
                <div>
                  <span className="font-semibold">{t('Created')}</span>
                  <p className="mt-1 text-muted-foreground">{formatDate(payment.created_at)}</p>
                </div>
              ) : null}
            </div>
            {payment.notes ? (
              <div className="mt-4">
                <span className="font-semibold">{t('Notes')}</span>
                <p className="mt-1 rounded bg-muted p-3 text-sm">{payment.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {payment.allocations && payment.allocations.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Invoice allocations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">{t('Invoice')}</th>
                      <th className="py-2 text-left">{t('Date')}</th>
                      <th className="py-2 text-right">{t('Invoice total')}</th>
                      <th className="py-2 text-right">{t('Allocated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.allocations.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="py-2 font-medium">
                          {row.invoice?.id ? (
                            <Link
                              to={`${paths.purchase.invoices}/${row.invoice.id}`}
                              className="text-primary hover:underline"
                            >
                              {row.invoice.invoice_number}
                            </Link>
                          ) : (
                            (row.invoice?.invoice_number ?? '—')
                          )}
                        </td>
                        <td className="py-2">
                          {row.invoice?.invoice_date
                            ? formatDate(row.invoice.invoice_date)
                            : '—'}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(Number(row.invoice?.total_amount ?? 0))}
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {formatCurrency(Number(row.allocated_amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={3} className="py-2 text-right">
                        {t('Total payment:')}
                      </td>
                      <td className="py-2 text-right text-lg">
                        {formatCurrency(Number(payment.payment_amount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {debitApps.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Debit note history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">{t('Debit note')}</th>
                      <th className="py-2 text-left">{t('Application date')}</th>
                      <th className="py-2 text-right">{t('Applied amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debitApps.map((app) => (
                      <tr key={app.id} className="border-b">
                        <td className="py-2 font-medium">
                          {app.debit_note?.id ? (
                            <Link
                              to={paths.account.debitNotes.show(app.debit_note.id)}
                              className="text-primary hover:underline"
                            >
                              {app.debit_note.debit_note_number}
                            </Link>
                          ) : (
                            (app.debit_note?.debit_note_number ?? `#${app.id}`)
                          )}
                        </td>
                        <td className="py-2">
                          {app.application_date ? formatDate(app.application_date) : '—'}
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {formatCurrency(Number(app.applied_amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={2} className="py-2 text-right">
                        {t('Total applied debit note:')}
                      </td>
                      <td className="py-2 text-right text-lg">
                        {formatCurrency(totalDebitApplied)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {payment.attachment ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Attachment')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img
                src={getImagePath(payment.attachment)}
                alt={payment.supplier?.name ?? t('Payment receipt')}
                className="max-h-96 rounded object-contain"
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ConfirmationDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title={t('Void payment')}
        message={t(
          'This will post a reversing journal entry, undo bank and AP effects, and restore open bill balances. The original payment record is kept.',
        )}
        confirmText={t('Void payment')}
        onConfirm={() => {
          statusMutation.mutate('voided')
          setVoidOpen(false)
        }}
        variant="destructive"
        loading={statusMutation.isPending}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete payment')}
        message={supplierPaymentDeleteMessage(payment, t)}
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
