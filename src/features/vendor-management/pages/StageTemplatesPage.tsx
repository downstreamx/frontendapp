import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createStageTemplate,
  deleteStageTemplate,
  listStageTemplates,
  resetStageTemplates,
  updateStageTemplate,
  type VmStageTemplate,
} from '@/features/vendor-management/vendor-management-api'

export function StageTemplatesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { auth } = useAppContext()
  const canManage = hasPermission(
    auth.permissions,
    auth.roles,
    auth.userType,
    'manage-vendor-management',
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VmStageTemplate | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['vm-stage-templates'],
    queryFn: listStageTemplates,
    enabled: canManage,
  })

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['vm-stage-templates'] })

  const create = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createStageTemplate({
        name: String(values.name ?? ''),
        color: String(values.color ?? '#64748b'),
        is_terminal: Boolean(values.is_terminal),
        sort_order: values.sort_order != null ? Number(values.sort_order) : undefined,
      }),
    onSuccess: () => {
      toast.success(t('Stage added'))
      setDialogOpen(false)
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const saveEdit = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateStageTemplate(editing!.id, {
        name: String(values.name ?? ''),
        color: String(values.color ?? '#64748b'),
        is_terminal: Boolean(values.is_terminal),
        sort_order: Number(values.sort_order ?? 0),
        slug: editing!.slug,
      }),
    onSuccess: () => {
      toast.success(t('Saved'))
      setDialogOpen(false)
      setEditing(null)
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteStageTemplate(id),
    onSuccess: () => {
      setDeleteId(null)
      toast.success(t('Deleted'))
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const reset = useMutation({
    mutationFn: resetStageTemplates,
    onSuccess: () => {
      setConfirmReset(false)
      toast.success(t('Reset to defaults'))
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const rows = query.data ?? []

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'name', label: t('Name'), required: true, placeholder: t('e.g. Site visit') },
      { name: 'color', label: t('Color'), type: 'color' },
      { name: 'sort_order', label: t('Sort order'), type: 'number', min: 0 },
      { name: 'is_terminal', label: t('Terminal stage'), type: 'checkbox' },
    ],
    [t],
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (row: VmStageTemplate) => {
    setEditing(row)
    setDialogOpen(true)
  }

  if (!canManage) {
    return (
      <ModuleListCard title={t('Default pipeline stages')}>
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            {t('You do not have permission to manage pipeline stages.')}
          </p>
        </div>
      </ModuleListCard>
    )
  }

  return (
    <ModuleListCard
      title={t('Default pipeline stages')}
      description={t('These stages are copied onto each new tender. Existing tenders are not changed.')}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
            {t('Reset to defaults')}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            {t('Add stage')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 px-6 pb-6">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('No stages yet.')}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: row.color || '#64748b' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                    {row.is_terminal ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {t('Terminal')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.slug} · #{row.sort_order}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                    {t('Edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={rows.length <= 1}
                    onClick={() => setDeleteId(row.id)}
                  >
                    {t('Delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        mode={editing ? 'edit' : 'add'}
        title={editing ? t('Edit stage') : t('Add stage')}
        fields={fields}
        initialValues={
          editing
            ? {
                name: editing.name,
                color: editing.color ?? '#64748b',
                sort_order: editing.sort_order,
                is_terminal: editing.is_terminal,
              }
            : undefined
        }
        defaultFieldValues={{ color: '#64748b', sort_order: '', is_terminal: 'false' }}
        isPending={create.isPending || saveEdit.isPending}
        onSubmit={(values) => {
          if (editing) saveEdit.mutate(values)
          else create.mutate(values)
        }}
      />

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('Reset pipeline stages?')}
        message={t('This replaces your company stage templates with the platform defaults.')}
        confirmText={t('Reset')}
        variant="destructive"
        loading={reset.isPending}
        onConfirm={() => reset.mutateAsync()}
      />

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        title={t('Delete stage?')}
        message={t('New tenders will no longer include this stage. Existing tenders are unchanged.')}
        confirmText={t('Delete')}
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteId == null) return
          return remove.mutateAsync(deleteId)
        }}
      />
    </ModuleListCard>
  )
}
