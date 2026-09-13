import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { DebitNoteStatusBadge } from '../components/DebitNoteStatusBadge'
import {
  canDeleteDebitNote,
  debitNoteDeleteMessage,
} from '../debit-note-delete'
import {
  approveDebitNote,
  deleteDebitNote,
  getDebitNote,
} from '../notes-api'

export function DebitNoteViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { auth } = useAppContext()

  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-debit-notes',
  )
  const canViewPurchaseReturn = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-purchase-return-invoices',
  )

  const noteQuery = useQuery({
    queryKey: ['debit-note', id],
    queryFn: () => getDebitNote(id!),
    enabled: Boolean(id),
  })

  const note = noteQuery.data
  const isDraft = note?.status === 'draft'

  useAccountPageChrome(
    note
      ? `${t('Debit Note')} #${note.debit_note_number ?? note.id}`
      : t('Debit Note Details'),
    t('Debit Notes'),
  )

  const approveMutation = useMutation({
    mutationFn: () => approveDebitNote(id!),
    onSuccess: () => {
      toast.success(t('Debit note approved'))
      void queryClient.invalidateQueries({ queryKey: ['debit-note', id] })
      void queryClient.invalidateQueries({ queryKey: ['debit-notes'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve debit note'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteDebitNote(id!),
    onSuccess: () => {
      toast.success(t('Debit note deleted successfully.'))
      void queryClient.invalidateQueries({ queryKey: ['debit-notes'] })
      navigate(paths.account.debitNotes.index)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete debit note'))),
  })

  if (noteQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (noteQuery.error || !note) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-destructive">{t('Debit note not found.')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={paths.account.debitNotes.index}>{t('Back to list')}</Link>
        </Button>
      </div>
    )
  }

  const showDelete = canDeleteDebitNote(
    note,
    auth.permissions,
    auth.roles,
    auth.user?.type,
  )
  const applications = note.applications ?? []

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg text-muted-foreground">
                  #{note.debit_note_number ?? note.id}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <DebitNoteStatusBadge status={note.status} />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(note.total_amount ?? 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('Total Amount')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">{t('CUSTOMER')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{note.supplier?.name ?? '—'}</div>
                  {note.supplier?.email ? (
                    <div className="text-muted-foreground">{note.supplier.email}</div>
                  ) : null}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">{t('DETAILS')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Date')}</span>
                    <span>
                      {note.debit_note_date ? formatDate(String(note.debit_note_date)) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Reason')}</span>
                    <span>{note.reason ?? '—'}</span>
                  </div>
                  {note.purchase_return?.return_number ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Purchase Return')}</span>
                      {canViewPurchaseReturn && note.purchase_return.id ? (
                        <Link
                          to={paths.purchase.returnShow(note.purchase_return.id)}
                          className="text-primary hover:underline"
                        >
                          {note.purchase_return.return_number}
                        </Link>
                      ) : (
                        <span>{note.purchase_return.return_number}</span>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded bg-blue-50 p-3 dark:bg-blue-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {isDraft && canApprove ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate()}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t('Approve Debit Note')}
                        </Button>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(Number(note.balance_amount ?? 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('Balance Amount')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {note.notes ? (
              <div className="mt-4 border-t pt-4">
                <span className="text-sm font-medium">{t('Notes')}:</span>
                <span className="ml-2 text-sm text-muted-foreground">{note.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Debit Note Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Qty')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Unit Price')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Discount')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Tax')}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">{t('Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(note.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.product?.name ?? '—'}</div>
                        {item.product?.sku ? (
                          <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-right">{item.quantity}</td>
                      <td className="px-4 py-4 text-right">
                        {formatCurrency(Number(item.unit_price))}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {Number(item.discount_percentage) > 0 ? (
                          <div>
                            <div>{item.discount_percentage}%</div>
                            <div className="text-sm text-muted-foreground">
                              -{formatCurrency(Number(item.discount_amount))}
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.taxes && item.taxes.length > 0 ? (
                          <div>
                            {item.taxes.map((tax, taxIndex) => (
                              <div key={taxIndex} className="text-sm">
                                {tax.tax_name} ({tax.tax_rate}%)
                              </div>
                            ))}
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(Number(item.tax_amount))}
                            </div>
                          </div>
                        ) : Number(item.tax_percentage) > 0 ? (
                          <div>
                            <div>{item.tax_percentage}%</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(Number(item.tax_amount))}
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {formatCurrency(Number(item.total_amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Subtotal')}</span>
                  <span className="font-medium">
                    {formatCurrency(Number(note.subtotal ?? 0))}
                  </span>
                </div>
                {Number(note.discount_amount) > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Discount')}</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(Number(note.discount_amount))}
                    </span>
                  </div>
                ) : null}
                {Number(note.tax_amount) > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Tax')}</span>
                    <span className="font-medium">
                      {formatCurrency(Number(note.tax_amount))}
                    </span>
                  </div>
                ) : null}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{t('Total Debit Amount')}</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(Number(note.total_amount ?? 0))}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Applied Amount')}</span>
                  <span className="font-medium">
                    {formatCurrency(Number(note.applied_amount ?? 0))}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-green-600">{t('Balance Amount')}</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(Number(note.balance_amount ?? 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {applications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('Applications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold">{t('Payment')}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        {t('Applied Amount')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">{t('Date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {applications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-4 py-4 text-sm">
                          {application.payment?.id ? (
                            <Link
                              to={paths.account.supplierPayments.show(application.payment.id)}
                              className="text-primary hover:underline"
                            >
                              {application.payment.payment_number ??
                                `#${application.payment.id}`}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                          {formatCurrency(Number(application.applied_amount))}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                          {application.application_date
                            ? formatDate(String(application.application_date))
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.account.debitNotes.index}>{t('Back to list')}</Link>
          </Button>
          {isDraft && showDelete ? (
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

        <ConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete Debit Note')}
          message={debitNoteDeleteMessage(note, t)}
          confirmText={t('Delete')}
          onConfirm={() => deleteMutation.mutate()}
          variant="destructive"
          loading={deleteMutation.isPending}
        />
      </div>
    </TooltipProvider>
  )
}
