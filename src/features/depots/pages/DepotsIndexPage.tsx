import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { createDepot, getDepot, listDepots, updateDepot, type Depot } from '../api'
import { depotSchema } from '../schemas'
import { DepotDetailDialog } from '../components/DepotDetailDialog'
import { DepotFormFields } from '../components/DepotFormFields'

type DepotFormValues = z.infer<typeof depotSchema>

const defaultValues: DepotFormValues = {
  name: '',
  contact_person: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  zip_code: '',
  phone: '',
  email: '',
  is_active: true,
}

export function DepotsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)

  usePageChrome({
    pageTitle: t('Depots'),
    breadcrumbs: [{ label: t('Depots & Distribution') }, { label: t('Depots') }],
  })

  const { data: depots = [], isLoading, error } = useQuery({
    queryKey: ['depots'],
    queryFn: () => listDepots(),
  })

  const form = useForm<DepotFormValues>({
    resolver: zodResolver(depotSchema),
    defaultValues,
  })

  const { data: editingDepot } = useQuery({
    queryKey: ['depots', editingId],
    queryFn: () => getDepot(editingId!),
    enabled: editingId != null,
  })

  useEffect(() => {
    if (!dialogOpen) return
    if (editingId == null) {
      form.reset(defaultValues)
      return
    }
    if (!editingDepot) return
    form.reset({
      name: editingDepot.name,
      contact_person: editingDepot.contact_person ?? '',
      address: editingDepot.address,
      city: editingDepot.city,
      state: editingDepot.state ?? '',
      country: editingDepot.country ?? 'Nigeria',
      zip_code: editingDepot.zip_code,
      phone: editingDepot.phone ?? '',
      email: editingDepot.email ?? '',
      is_active: editingDepot.is_active !== false,
    })
  }, [dialogOpen, editingId, editingDepot, form])

  const saveMutation = useMutation({
    mutationFn: (values: DepotFormValues) => {
      const body = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
      }
      return editingId != null ? updateDepot(editingId, body) : createDepot(body)
    },
    onSuccess: () => {
      toast.success(editingId != null ? t('Depot updated') : t('Depot created'))
      setDialogOpen(false)
      setEditingId(null)
      void queryClient.invalidateQueries({ queryKey: ['depots'] })
    },
    onError: () => toast.error(t('Failed to save depot')),
  })

  const openCreate = () => {
    setEditingId(null)
    setDialogOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setDialogOpen(true)
  }

  const openView = (id: number) => {
    setViewingId(id)
  }

  const columns: Column<Depot>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('Name'),
        render: (_, row) => <span className="font-medium">{row.name}</span>,
      },
      {
        key: 'contact_person',
        header: t('Contact'),
        render: (value) => (value ? String(value) : '—'),
      },
      {
        key: 'phone',
        header: t('Phone'),
        render: (value) => (value ? String(value) : '—'),
      },
      {
        key: 'city',
        header: t('City'),
      },
      {
        key: 'state',
        header: t('State'),
        render: (value) => (value ? String(value) : '—'),
      },
      {
        key: 'is_active',
        header: t('Status'),
        render: (_, row) => (
          <Badge variant={row.is_active !== false ? 'secondary' : 'outline'}>
            {row.is_active !== false ? t('Active') : t('Inactive')}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (_, row) => (
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <TableRowActions onEdit={() => openEdit(row.id)} />
          </div>
        ),
      },
    ],
    [t],
  )

  return (
    <>
      <ModuleListCard
        title={t('Depots')}
        description={t('Manage depot locations and contact details.')}
        canCreate
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
      >
        {depots.length === 0 && !isLoading ? (
          <NoRecordsFound
            title={t('No depots found')}
            description={t('No depots yet.')}
            createPermission="create-depots"
            onCreateClick={openCreate}
            createButtonText={t('Create depot')}
          />
        ) : (
          <DataTable
            embedded
            columns={columns}
            data={depots}
            rowProps={(row) => ({
              className: 'cursor-pointer',
              onClick: () => openView(row.id),
            })}
          />
        )}
      </ModuleListCard>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingId(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? t('Edit depot') : t('Create depot')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <DepotFormFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('Saving…') : t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DepotDetailDialog
        depotId={viewingId}
        open={viewingId != null}
        onOpenChange={(open) => {
          if (!open) setViewingId(null)
        }}
      />
    </>
  )
}
