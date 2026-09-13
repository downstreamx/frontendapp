import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Building2, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { CustomerDetailsContent } from '../components/CustomerDetailsContent'
import { CustomerBalanceSection } from '../components/CustomerBalanceSection'
import { CustomerCreditLimitCard } from '../components/CustomerCreditLimitCard'
import { CustomerPaymentReminderSettingsCard } from '../components/CustomerPaymentReminderSettingsCard'
import { getCustomer } from '../account-party-api'
import { canDeleteCustomer, customerDeleteMessage } from '../customer-delete'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'

export function CustomerViewPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-customers')
  const canViewReport = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-customer-detail-report',
  )

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['account', 'customers', id],
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'account.customers.destroy',
      defaultMessage: t('Are you sure you want to delete this customer?'),
      onSuccess: () => {
        toast.success(t('The customer has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['account', 'customers'] })
        navigate(paths.account.customers)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete customer'))),
    })

  useAccountPageChrome(
    customer?.company_name ? `${t('Customer Details')}: ${customer.company_name}` : t('Customer Details'),
    t('Customers'),
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !customer) {
    return <p className="p-6 text-sm text-destructive">{t('Customer not found.')}</p>
  }

  const showDelete = canDeleteCustomer(customer, auth.permissions, auth.roles, auth.user?.type)

  const openReport = () => {
    if (!customer.user_id) return
    const params = new URLSearchParams({ customer: String(customer.user_id) })
    navigate(`${paths.account.reports}?${params.toString()}`)
  }

  return (
    <>
      <Card className="mx-auto max-w-4xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <span className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </span>
              <span>
                <span className="block">{customer.company_name}</span>
                {customer.customer_code ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {customer.customer_code}
                  </span>
                ) : null}
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {canViewReport && customer.user_id ? (
                <Button type="button" size="sm" variant="outline" onClick={openReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('View Report')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={paths.account.customerEdit(customer.id)}>{t('Edit')}</Link>
                </Button>
              ) : null}
              {showDelete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteDialog(customer.id, customerDeleteMessage(customer, t))}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('Delete')}
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link to={paths.account.customers}>{t('Back to list')}</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {customer.balance?.credit_limit ? (
            <CustomerCreditLimitCard metrics={customer.balance.credit_limit} />
          ) : null}
          {customer.balance ? (
            <CustomerBalanceSection balance={customer.balance} showReportLink />
          ) : null}
          <CustomerPaymentReminderSettingsCard customerId={customer.id} />
          <CustomerDetailsContent customer={customer} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Customer')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </>
  )
}
