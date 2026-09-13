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
import { SupplierDetailsContent } from '../components/SupplierDetailsContent'
import { SupplierPaymentReminderSettingsCard } from '../components/SupplierPaymentReminderSettingsCard'
import { getSupplier } from '../account-party-api'
import { canDeleteSupplier, supplierDeleteMessage } from '../supplier-delete'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'

export function SupplierViewPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-suppliers')
  const canViewReport = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-supplier-detail-report',
  )

  const { data: supplier, isLoading, error } = useQuery({
    queryKey: ['account', 'suppliers', id],
    queryFn: () => getSupplier(id!),
    enabled: Boolean(id),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'account.suppliers.destroy',
      defaultMessage: t('Are you sure you want to delete this supplier?'),
      onSuccess: () => {
        toast.success(t('The supplier has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['account', 'suppliers'] })
        navigate(paths.account.suppliers)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete supplier'))),
    })

  useAccountPageChrome(
    supplier?.company_name ? `${t('Supplier Details')}: ${supplier.company_name}` : t('Supplier Details'),
    t('Suppliers'),
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !supplier) {
    return <p className="p-6 text-sm text-destructive">{t('Supplier not found.')}</p>
  }

  const showDelete = canDeleteSupplier(supplier, auth.permissions, auth.roles, auth.user?.type)

  const openReport = () => {
    if (!supplier.user_id) return
    const params = new URLSearchParams({ supplier: String(supplier.user_id) })
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
                <span className="block">{supplier.company_name}</span>
                {supplier.supplier_code ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {supplier.supplier_code}
                  </span>
                ) : null}
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {canViewReport && supplier.user_id ? (
                <Button type="button" size="sm" variant="outline" onClick={openReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('View Report')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={paths.account.supplierEdit(supplier.id)}>{t('Edit')}</Link>
                </Button>
              ) : null}
              {showDelete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteDialog(supplier.id, supplierDeleteMessage(supplier, t))}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('Delete')}
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link to={paths.account.suppliers}>{t('Back to list')}</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <SupplierPaymentReminderSettingsCard supplierId={supplier.id} />
          <SupplierDetailsContent supplier={supplier} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Supplier')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </>
  )
}
