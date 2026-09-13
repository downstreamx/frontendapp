import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Tag } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { extractPaginatedList, useResourceList } from '@/hooks/use-resource-list'
import { createRestCrudApi } from '@/lib/crud-api'
import { hasPermission } from '@/lib/permissions'
import { useAppContext } from '@/contexts/app-context'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'

type Props = {
  title: string
  listKey: string
  apiEndpoint: string
  createPath?: string
  onCreateNavigate?: () => void
  showPath?: (id: string | number) => string
  editPath?: (id: string | number) => string
  labelKeys?: string[]
  description?: string
  emptyIcon?: LucideIcon
  fields?: CrudFieldDef[]
  defaultFieldValues?: Record<string, string>
  permissions?: {
    create?: string
    edit?: string
    delete?: string
  }
  columns?: Column<Record<string, unknown>>[]
  /** Called when opening edit modal so parents can sync dependent field state. */
  onPrepareEdit?: (row: Record<string, unknown>) => void
  /** When false, uses a minimal list (legacy modules should keep default true). */
  legacyLayout?: boolean
}

function label(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]
    if (val != null && val !== '') return String(val)
  }
  return `#${String(row.id ?? '—')}`
}

export function ResourceIndexPage({
  title,
  listKey,
  apiEndpoint,
  createPath,
  onCreateNavigate,
  showPath,
  editPath,
  labelKeys = ['name', 'title', 'id'],
  description,
  emptyIcon: EmptyIcon = Tag,
  fields,
  defaultFieldValues,
  permissions,
  columns: columnsOverride,
  onPrepareEdit,
  legacyLayout = true,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const queryClient = useQueryClient()
  const crud = useMemo(() => createRestCrudApi<Record<string, unknown>>(apiEndpoint), [apiEndpoint])

  const { data, isLoading, error } = useResourceList(listKey, apiEndpoint)
  const { rows, meta: listMeta } = useMemo(
    () => extractPaginatedList<Record<string, unknown>>(data),
    [data],
  )
  const listPagination =
    listMeta.from != null && listMeta.from > 1 ? listMeta : listMeta.last_page > 1 ? listMeta : undefined

  const [modalMode, setModalMode] = useState<'add' | 'edit' | ''>('')
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const createPermission = permissions?.create
  const mayCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, createPermission)
  const canCreateModal = !!fields && mayCreate
  const canCreateExternal = !!(createPath || onCreateNavigate) && mayCreate
  const canCreate = canCreateModal || canCreateExternal
  const supportsMutations = !!fields

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [listKey] })
    if (['/hrm/branches', '/hrm/departments', '/hrm/designations'].includes(apiEndpoint)) {
      void queryClient.invalidateQueries({ queryKey: ['hrm', 'create-meta'] })
    }
  }

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => crud.create(payload),
    onSuccess: () => {
      toast.success(t('Created successfully'))
      invalidate()
      closeModal()
    },
    onError: () => toast.error(t('Failed to create')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      crud.update(id, payload),
    onSuccess: () => {
      toast.success(t('Saved successfully'))
      invalidate()
      closeModal()
    },
    onError: () => toast.error(t('Failed to save')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crud.remove(id),
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: () => toast.error(t('Failed to delete')),
  })

  const openCreate = useCallback(() => {
    setEditRow(null)
    setModalMode('add')
  }, [])

  const openEdit = useCallback(
    (row: Record<string, unknown>) => {
      onPrepareEdit?.(row)
      setEditRow(row)
      setModalMode('edit')
    },
    [onPrepareEdit],
  )

  const closeModal = useCallback(() => {
    setModalMode('')
    setEditRow(null)
  }, [])

  const handleCreateClick = useCallback(() => {
    if (fields) {
      openCreate()
      return
    }
    if (onCreateNavigate) {
      onCreateNavigate()
      return
    }
    if (createPath) {
      navigate(createPath)
    }
  }, [fields, onCreateNavigate, createPath, navigate, openCreate])

  const tableColumns = useMemo((): Column<Record<string, unknown>>[] => {
    const dataColumns: Column<Record<string, unknown>>[] = columnsOverride
      ? [...columnsOverride]
      : labelKeys
          .filter((key) => key !== 'id')
          .map((key) => ({
        key,
        header: t(key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
        render: (value: unknown, row: Record<string, unknown>) => {
          if (key === 'color' && typeof value === 'string') {
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: value }}
                />
              </div>
            )
          }
          if (key === 'is_credit') {
            return value === true || value === 'true' || value === 1 ? t('Yes') : t('No')
          }
          if (showPath && key === labelKeys[0] && row.id != null) {
            return (
              <Link
                to={showPath(row.id as string | number)}
                className="text-primary hover:underline"
              >
                {label(row, [key])}
              </Link>
            )
          }
          return value != null ? String(value) : '—'
        },
      }))

    const hasActionsColumn = dataColumns.some((column) => column.key === 'actions')

    if ((supportsMutations || showPath || editPath) && !hasActionsColumn) {
      dataColumns.push({
        key: 'actions',
        header: t('Action'),
        render: (_value, row) => (
          <TableRowActions
            onView={
              showPath && row.id != null
                ? () => navigate(showPath(row.id as string | number))
                : undefined
            }
            editPermission={permissions?.edit}
            deletePermission={permissions?.delete}
            onEdit={
              row.id != null
                ? editPath
                  ? () => navigate(editPath(row.id as string | number))
                  : supportsMutations
                    ? () => openEdit(row)
                    : undefined
                : undefined
            }
            onDelete={
              (supportsMutations || editPath) && row.id != null
                ? () => setDeleteId(Number(row.id))
                : undefined
            }
          />
        ),
      })
    }

    return dataColumns
  }, [columnsOverride, editPath, labelKeys, navigate, openEdit, permissions, showPath, supportsMutations, t])

  const modalOpen = modalMode === 'add' || modalMode === 'edit'

  if (!legacyLayout) {
    return (
      <ModuleListCard title={title} isLoading={isLoading} error={!!error} pagination={listPagination}>
        <DataTable
          data={rows}
          columns={tableColumns}
          className="rounded-none border-0 shadow-none"
          emptyState={<p className="text-sm text-muted-foreground p-4">{t('No records yet.')}</p>}
        />
      </ModuleListCard>
    )
  }

  return (
    <>
      <ModuleListCard
        title={title}
        description={description}
        canCreate={canCreate}
        onCreateClick={canCreate ? handleCreateClick : undefined}
        isLoading={isLoading}
        error={!!error}
        pagination={listPagination}
      >
        <DataTable
          data={rows}
          columns={tableColumns}
          className="rounded-none border-0 shadow-none"
          emptyState={
            <NoRecordsFound
              icon={EmptyIcon}
              title={t('No {{entity}} found', { entity: title.toLowerCase() })}
              description={t('Get started by creating your first record.')}
              createPermission={permissions?.create}
              onCreateClick={canCreate ? handleCreateClick : undefined}
              createButtonText={t('Create {{entity}}', { entity: title })}
              className="h-auto py-8"
            />
          }
        />
      </ModuleListCard>

      {fields && (
        <CrudFormDialog
          open={modalOpen}
          mode={modalMode === 'edit' ? 'edit' : 'add'}
          title={modalMode === 'edit' ? t('Edit {{entity}}', { entity: title }) : t('Create {{entity}}', { entity: title })}
          fields={fields}
          initialValues={editRow ?? undefined}
          defaultFieldValues={defaultFieldValues}
          isPending={createMutation.isPending || updateMutation.isPending}
          onOpenChange={(open) => !open && closeModal()}
          onSubmit={(raw) => {
            const payload = { ...raw }
            for (const key of Object.keys(payload)) {
              if (key.endsWith('_id') && payload[key] !== '' && payload[key] != null) {
                payload[key] = Number(payload[key])
              }
            }
            if (modalMode === 'edit' && editRow?.id != null) {
              updateMutation.mutate({ id: Number(editRow.id), payload })
            } else {
              createMutation.mutate(payload)
            }
          }}
        />
      )}

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete {{entity}}', { entity: title })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
