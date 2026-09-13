import { useCallback, useMemo, useState } from 'react'
import { Edit, Plus, Ruler, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { extractListRows } from '@/hooks/use-resource-list'
import { useAppContext } from '@/contexts/app-context'
import { createRestCrudApi } from '@/lib/crud-api'
import { getApiErrorMessage } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'

export type ProductUnit = {
  id: number
  unit_name: string
  is_system?: boolean
}

const LIST_KEY = 'product-service/units'
const API_BASE = '/product-service/units'

export function UnitsIndexPage() {
  const { t } = useTranslation()
  const unitFields: CrudFieldDef[] = useMemo(
    () => [
      {
        name: 'unit_name',
        label: t('Unit Name'),
        required: true,
        placeholder: t('Enter unit name'),
      },
    ],
    [t],
  )
  const { auth } = useAppContext()
  const queryClient = useQueryClient()
  const crud = useMemo(() => createRestCrudApi<ProductUnit>(API_BASE), [])

  const { data, isLoading, error } = useQuery({
    queryKey: [LIST_KEY],
    queryFn: () => crud.list({ per_page: 200 }),
  })

  const rows = extractListRows<ProductUnit>(data)

  const [modalMode, setModalMode] = useState<'add' | 'edit' | ''>('')
  const [editRow, setEditRow] = useState<ProductUnit | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const mayCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-product-service-units',
  )
  const mayEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-product-service-units',
  )
  const mayDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-product-service-units',
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] })

  const closeModal = useCallback(() => {
    setModalMode('')
    setEditRow(null)
  }, [])

  const openCreate = useCallback(() => {
    setEditRow(null)
    setModalMode('add')
  }, [])

  const openEdit = useCallback((row: ProductUnit) => {
    setEditRow(row)
    setModalMode('edit')
  }, [])

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => crud.create(payload),
    onSuccess: () => {
      toast.success(t('The unit has been created successfully.'))
      invalidate()
      closeModal()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create unit'))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      crud.update(id, payload),
    onSuccess: () => {
      toast.success(t('The unit details are updated successfully.'))
      invalidate()
      closeModal()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update unit'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crud.remove(id),
    onSuccess: () => {
      toast.success(t('The unit has been deleted.'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete unit'))),
  })

  const columns = useMemo((): Column<ProductUnit>[] => {
    const cols: Column<ProductUnit>[] = [{ key: 'unit_name', header: t('Unit Name') }]

    if (mayEdit || mayDelete) {
      cols.push({
        key: 'actions',
        header: t('Action'),
        render: (_value, row) => (
          <div className="flex gap-1">
            {mayEdit ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(row)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Edit')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {mayDelete && !row.is_system ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(row.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Delete')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ),
      })
    }

    return cols
  }, [mayDelete, mayEdit, openEdit, t])

  const modalOpen = modalMode === 'add' || modalMode === 'edit'

  const handleSubmit = (raw: Record<string, unknown>) => {
    const payload = { unit_name: raw.unit_name }
    if (modalMode === 'edit' && editRow) {
      updateMutation.mutate({ id: editRow.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <TooltipProvider>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium">{t('Units')}</h3>
            {mayCreate ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Create')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : error ? (
            <p className="text-sm text-destructive">{t('Failed to load units.')}</p>
          ) : (
            <div className="max-h-[75vh] w-full overflow-y-auto rounded-none">
              <div className="min-w-[600px]">
                <DataTable
                  data={rows}
                  columns={columns}
                  className="rounded-none"
                  emptyState={
                    <NoRecordsFound
                      icon={Ruler}
                      title={t('No units found')}
                      description={t('Get started by creating your first unit.')}
                      createPermission="create-product-service-units"
                      onCreateClick={mayCreate ? openCreate : undefined}
                      createButtonText={t('Create Unit')}
                      className="h-auto"
                    />
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CrudFormDialog
        open={modalOpen}
        mode={modalMode === 'edit' ? 'edit' : 'add'}
        title={modalMode === 'edit' ? t('Edit Unit') : t('Create Unit')}
        fields={unitFields}
        initialValues={editRow ?? undefined}
        isPending={createMutation.isPending || updateMutation.isPending}
        submitLabel={
          createMutation.isPending || updateMutation.isPending
            ? modalMode === 'edit'
              ? t('Updating...')
              : t('Creating...')
            : modalMode === 'edit'
              ? t('Update')
              : t('Create')
        }
        onOpenChange={(open) => !open && closeModal()}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete Unit')}
        message={t('Are you sure you want to delete this unit?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
