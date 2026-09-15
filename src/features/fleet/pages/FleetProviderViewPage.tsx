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
import { formatDate, getImagePath } from '@/utils/helpers'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import {
  fetchMaintenanceProvider,
  fetchTruckProvider,
} from '../fleet-api'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type ProviderKind = 'truck' | 'maintenance'

type Props = {
  kind: ProviderKind
}

export function TruckProviderViewPage() {
  return <FleetProviderViewPage kind="truck" />
}

export function MaintenanceProviderViewPage() {
  return <FleetProviderViewPage kind="maintenance" />
}

function FleetProviderViewPage({ kind }: Props) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const isTruck = kind === 'truck'
  const listPath = isTruck ? paths.fleet.truckProviders : paths.fleet.maintenanceProviders
  const editPath = isTruck ? paths.fleet.truckProviderEdit : paths.fleet.maintenanceProviderEdit
  const destroyRoute = isTruck ? 'fleet.truck-providers.destroy' : 'fleet.maintenance-providers.destroy'
  const editPerm = isTruck ? 'edit-truck-providers' : 'edit-maintenance-providers'
  const deletePerm = isTruck ? 'delete-truck-providers' : 'delete-maintenance-providers'

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, editPerm)
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, deletePerm)

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['fleet', kind, 'providers', id],
    queryFn: () => (isTruck ? fetchTruckProvider(id!) : fetchMaintenanceProvider(id!)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: provider?.name ?? t('Provider'),
    breadcrumbs: [
      { label: t('Fleet') },
      {
        label: isTruck ? t('Truck Providers') : t('Maintenance Providers'),
        url: listPath,
      },
      { label: provider?.name ?? t('Provider') },
    ],
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: destroyRoute,
      defaultMessage: t('Are you sure you want to delete this provider?'),
      onSuccess: () => {
        toast.success(t('Provider deleted'))
        navigate(listPath)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete provider'))),
    })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (error || !provider) {
    return <p className="text-sm text-destructive">{t('Provider not found.')}</p>
  }

  const fields: Array<{ label: string; value: ReactNode }> = [
    { label: t('Name'), value: provider.name },
    {
      label: t('Type'),
      value: provider.truck_provider_type?.name ?? '—',
    },
    { label: t('Tax ID'), value: provider.tax_id ?? '—' },
    { label: t('Status'), value: <FleetStatusBadge status={provider.status} /> },
    { label: t('Contact person'), value: provider.contact_person_name ?? '—' },
    { label: t('Email'), value: provider.contact_email ?? '—' },
    { label: t('Phone'), value: provider.contact_phone ?? '—' },
    { label: t('Address'), value: provider.contact_address ?? '—' },
    { label: t('Payment terms'), value: provider.payment_terms ?? '—' },
    {
      label: t('Contract start'),
      value: provider.contract_start_date ? formatDate(provider.contract_start_date) : '—',
    },
    {
      label: t('Contract end'),
      value: provider.contract_end_date ? formatDate(provider.contract_end_date) : '—',
    },
    { label: t('Rating'), value: provider.rating ?? '—' },
    { label: t('Active'), value: provider.is_active ? t('Yes') : t('No') },
    { label: t('Description'), value: provider.description ?? '—' },
  ]

  const visibleFields = isTruck ? fields : fields.filter((f) => f.label !== t('Type'))

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {provider.avatar ? (
            <img
              src={getImagePath(provider.avatar)}
              alt=""
              className="h-14 w-14 rounded-lg border object-cover"
            />
          ) : null}
          <h1 className="text-2xl font-semibold">{provider.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button asChild variant="outline" size="sm">
              <Link to={editPath(provider.id)}>
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
                openDeleteDialog(provider.id, t('Delete provider "{{name}}"?', { name: provider.name }))
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
            {visibleFields.map(({ label, value }) => (
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
        title={t('Delete provider')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </article>
  )
}
