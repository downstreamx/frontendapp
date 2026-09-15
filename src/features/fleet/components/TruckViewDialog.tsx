import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { TruckStatusBadge } from './TruckStatusBadge'
import { TruckOperationalStatusBadge } from './TruckOperationalStatusBadge'
import { TruckCurrentLoadSummary } from './TruckCurrentLoadSummary'
import { fetchTruck } from '../fleet-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type Props = {
  truckId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (id: number) => void
  onDeleted?: () => void
}

export function TruckViewDialog({ truckId, open, onOpenChange, onEdit, onDeleted }: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-trucks')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-trucks')

  const { data: truck, isLoading, error } = useQuery({
    queryKey: ['fleet', 'trucks', truckId],
    queryFn: () => fetchTruck(truckId!),
    enabled: open && truckId != null,
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.trucks.destroy',
      defaultMessage: t('Are you sure you want to delete this truck?'),
      onSuccess: () => {
        toast.success(t('The truck has been deleted.'))
        onOpenChange(false)
        onDeleted?.()
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete truck'))),
    })

  const fields: Array<{ label: string; value: ReactNode }> = truck
    ? [
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
          value:
            truck.purchase_price != null ? formatCurrency(Number(truck.purchase_price)) : '—',
        },
        {
          label: t('Fuel Capacity'),
          value: truck.capacity_litres != null ? `${truck.capacity_litres} L` : '—',
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
    : []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
          {isLoading ? (
            <PageContentLoader className="min-h-[12rem] py-10" />
          ) : error || !truck ? (
            <p className="p-6 text-sm text-destructive">{t('Truck not found.')}</p>
          ) : (
            <>
              <img
                src={getImagePath(truck.avatar ?? 'avatar.png')}
                alt={truck.plate_number}
                className="h-auto w-full object-contain"
              />
              <div className="space-y-4 p-6">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle>{truck.plate_number}</DialogTitle>
                </DialogHeader>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.label}>
                      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                      <dd className="mt-1 text-sm">{field.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium">{t('Current truck load')}</p>
                  <TruckCurrentLoadSummary load={truck.current_truck_load} />
                </div>
                {truck.additional_info ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Additional Info')}</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                      {truck.additional_info}
                    </p>
                  </div>
                ) : null}
                {canEdit || canDelete ? (
                  <DialogFooter className="gap-2 sm:justify-start">
                    {canEdit && onEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false)
                          onEdit(truck.id)
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {t('Edit')}
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
                            t('Are you sure you want to delete "{{plate}}"?', {
                              plate: truck.plate_number,
                            }),
                          )
                        }
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t('Delete')}
                      </Button>
                    ) : null}
                  </DialogFooter>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(next) => !next && closeDeleteDialog()}
        title={t('Delete Truck')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
