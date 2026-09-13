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
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'
import { TruckStatusBadge } from '../components/TruckStatusBadge'
import { TruckOperationalStatusBadge } from '../components/TruckOperationalStatusBadge'
import { TruckCurrentLoadSummary } from '../components/TruckCurrentLoadSummary'
import { TruckLoadTimeline } from '../components/TruckLoadTimeline'
import { fetchTruck } from '../fleet-api'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'

export function TruckViewPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-trucks')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-trucks')

  const { data: truck, isLoading, error } = useQuery({
    queryKey: ['fleet', 'trucks', id],
    queryFn: () => fetchTruck(id!),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: truck?.plate_number ?? t('Truck'),
    breadcrumbs: [
      { label: t('Fleet') },
      { label: t('Trucks'), url: paths.fleet.trucks },
      { label: truck?.plate_number ?? t('Truck') },
    ],
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.trucks.destroy',
      defaultMessage: t('Are you sure you want to delete this truck?'),
      onSuccess: () => {
        toast.success(t('The truck has been deleted.'))
        navigate(paths.fleet.trucks)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete truck'))),
    })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }
  if (error || !truck) {
    return <p className="text-sm text-destructive">{t('Truck not found.')}</p>
  }

  const fields: Array<{ label: string; value: ReactNode }> = [
    { label: t('Plate Number'), value: truck.plate_number },
    { label: t('Provider'), value: truck.truck_provider?.name ?? '—' },
    { label: t('Make'), value: truck.make },
    { label: t('Model'), value: truck.truck_model },
    { label: t('Fleet status'), value: <TruckStatusBadge status={truck.status} /> },
    {
      label: t('Operational status'),
      value: <TruckOperationalStatusBadge status={truck.operational_status} />,
    },
    { label: t('Colour'), value: truck.color ?? '—' },
    { label: t('Year'), value: truck.year },
    {
      label: t('Purchase Price'),
      value: truck.purchase_price != null ? formatCurrency(Number(truck.purchase_price)) : '—',
    },
    {
      label: t('Fuel Capacity'),
      value: truck.fuel_capacity != null ? `${truck.fuel_capacity} L` : '—',
    },
    { label: t('Engine Size'), value: truck.engine_size ?? '—' },
    { label: t('Engine Hours'), value: truck.engine_hours ?? '—' },
    { label: t('Axle Count'), value: truck.axle_count ?? '—' },
    {
      label: t('Purchase Date'),
      value: truck.purchase_date ? formatDate(truck.purchase_date) : '—',
    },
    { label: t('Current Odometer'), value: truck.current_odometer ?? '—' },
    { label: t('Active'), value: truck.is_active ? t('Yes') : t('No') },
  ]

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{truck.plate_number}</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button asChild variant="outline" size="sm">
              <Link to={paths.fleet.truckEdit(truck.id)}>
                <Pencil className="mr-1 h-4 w-4" />
                {t('Edit')}
              </Link>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() =>
                openDeleteDialog(
                  truck.id,
                  t('Are you sure you want to delete "{{plate}}"?', { plate: truck.plate_number }),
                )
              }
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('Delete')}
            </Button>
          ) : null}
          <Link to={paths.fleet.trucks} className="self-center text-sm text-primary hover:underline">
            {t('Back to trucks')}
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Truck Information')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <img
            src={getImagePath(truck.avatar ?? 'avatar.png')}
            alt={truck.plate_number}
            className="mx-auto h-32 w-32 rounded-lg border object-cover"
          />
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 text-sm">{field.value}</dd>
              </div>
            ))}
          </dl>
          {truck.additional_info ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('Additional Info')}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                {truck.additional_info}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Current truck load')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TruckCurrentLoadSummary load={truck.current_truck_load} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Load history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TruckLoadTimeline truckId={truck.id} limit={15} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Truck')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </article>
  )
}
