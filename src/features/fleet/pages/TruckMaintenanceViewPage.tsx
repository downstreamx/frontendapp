import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import { fetchTruckMaintenance } from '../fleet-api'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function TruckMaintenanceViewPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-truck-maintenances',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-truck-maintenances',
  )

  const { data: maintenance, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', id],
    queryFn: () => fetchTruckMaintenance(id!),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: maintenance?.service_type ?? t('Maintenance'),
    breadcrumbs: [
      { label: t('Fleet') },
      { label: t('Truck Maintenances'), url: paths.fleet.truckMaintenances },
      { label: maintenance?.service_type ?? t('Maintenance') },
    ],
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-maintenances.destroy',
      defaultMessage: t('Are you sure you want to delete this maintenance record?'),
      onSuccess: () => {
        toast.success(t('Maintenance deleted'))
        navigate(paths.fleet.truckMaintenances)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete maintenance'))),
    })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (error || !maintenance) {
    return <p className="text-sm text-destructive">{t('Maintenance record not found.')}</p>
  }

  const fields: Array<{ label: string; value: ReactNode }> = [
    {
      label: t('Truck'),
      value: truckLabel(maintenance.truck, maintenance.truck_id),
    },
    { label: t('Provider'), value: maintenance.maintenance_provider?.name ?? '—' },
    { label: t('Service type'), value: maintenance.service_type ?? '—' },
    { label: t('Status'), value: <FleetStatusBadge status={maintenance.status} /> },
    {
      label: t('Start date'),
      value: maintenance.start_date ? formatDate(maintenance.start_date) : '—',
    },
    {
      label: t('Completion date'),
      value: maintenance.completion_date ? formatDate(maintenance.completion_date) : '—',
    },
    {
      label: t('Next service due'),
      value: maintenance.nexts_service_due_date
        ? formatDate(maintenance.nexts_service_due_date)
        : '—',
    },
    { label: t('Odometer'), value: maintenance.odometer ?? '—' },
    {
      label: t('Parts cost'),
      value:
        maintenance.parts_cost != null && maintenance.parts_cost !== ''
          ? formatCurrency(maintenance.parts_cost)
          : '—',
    },
    {
      label: t('Labor cost'),
      value:
        maintenance.labor_cost != null && maintenance.labor_cost !== ''
          ? formatCurrency(maintenance.labor_cost)
          : '—',
    },
    {
      label: t('Total cost'),
      value:
        maintenance.total_cost != null && maintenance.total_cost !== ''
          ? formatCurrency(maintenance.total_cost)
          : '—',
    },
    { label: t('Job description'), value: maintenance.job_description ?? '—' },
    { label: t('Parts replaced'), value: maintenance.parts_replaced ?? '—' },
  ]

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold capitalize">
          {(maintenance.service_type ?? t('Maintenance')).replace(/-/g, ' ')}
        </h1>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button asChild variant="outline" size="sm">
              <Link to={paths.fleet.truckMaintenanceEdit(maintenance.id)}>
                <Pencil className="mr-1 h-4 w-4" />
                {t('Edit')}
              </Link>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                openDeleteDialog(
                  maintenance.id,
                  t('Delete maintenance "{{service}}"?', {
                    service: maintenance.service_type ?? t('record'),
                  }),
                )
              }
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('Delete')}
            </Button>
          ) : null}
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete maintenance')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </article>
  )
}
