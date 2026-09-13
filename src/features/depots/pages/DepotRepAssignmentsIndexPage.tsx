import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { personName } from '@/features/shared/lib/entity-labels'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'
import {
  createDepotRepAssignment,
  fetchDepotRepAssignmentsIndexMeta,
  listDepotRepAssignmentsPaginated,
  type DepotRepAssignmentRow,
} from '../depots-api'

export function DepotRepAssignmentsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const toolbar = useListToolbar()
  const [createOpen, setCreateOpen] = useState(false)
  const [depotId, setDepotId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)

  const canManage = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-depot-rep-assignments',
  )
  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-depot-rep-assignments',
  )

  usePageChrome({
    pageTitle: t('Depot Rep Assignments'),
    breadcrumbs: [{ label: t('Depots') }, { label: t('Depot Rep Assignments') }],
  })

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: '1',
      search: toolbar.appliedSearch || undefined,
    }),
    [toolbar.appliedSearch, toolbar.perPage],
  )

  const { data: indexMeta } = useQuery({
    queryKey: ['depot-rep-assignments', 'index-meta'],
    queryFn: fetchDepotRepAssignmentsIndexMeta,
    enabled: canManage,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['depot-rep-assignments', listParams],
    queryFn: () => listDepotRepAssignmentsPaginated(listParams),
    enabled: canManage,
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'depot-rep-assignments.destroy',
      defaultMessage: t('Are you sure you want to remove this assignment?'),
      onSuccess: () => {
        toast.success(t('Assignment deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['depot-rep-assignments'] })
      },
    })

  const columns: Column<DepotRepAssignmentRow>[] = [
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name ?? `#${row.depot_id}`,
    },
    {
      key: 'user',
      header: t('Depot Rep'),
      render: (_, row) => (
        <TableUserAvatarCell
          avatar={row.user?.avatar}
          name={personName(row.user, row.user_id)}
        />
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          deletePermission="delete-depot-rep-assignments"
          onDelete={() =>
            openDeleteDialog(
              row.id,
              t('Remove {{rep}} from {{depot}}?', {
                rep: personName(row.user, row.user_id),
                depot: row.depot?.name ?? `#${row.depot_id}`,
              }),
            )
          }
        />
      ),
    },
  ]

  const submit = async () => {
    if (!depotId || !userId) {
      toast.error(t('Depot and depot rep are required'))
      return
    }
    setSaving(true)
    try {
      const result = await createDepotRepAssignment({
        depot_id: Number(depotId),
        user_id: Number(userId),
      })
      toast.success(result.message ?? t('Depot rep assigned.'))
      setCreateOpen(false)
      setDepotId('')
      setUserId('')
      void queryClient.invalidateQueries({ queryKey: ['depot-rep-assignments'] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('Failed to assign depot rep')))
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <>
      <ModuleListCard
        title={t('Depot Rep Assignments')}
        description={t('Link depot reps to the depots they may operate on.')}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        pagination={data?.meta}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: toolbar.applySearch,
          searchPlaceholder: t('Search assignments...'),
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        }}
      >
        {data?.rows.length ? (
          <DataTable columns={columns} data={data.rows} embedded />
        ) : (
          <NoRecordsFound message={t('No depot rep assignments yet.')} />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Assign Depot Rep')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>{t('Depot')}</Label>
              <Select value={depotId} onValueChange={setDepotId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select depot')} />
                </SelectTrigger>
                <SelectContent>
                  {(indexMeta?.depots ?? []).map((depot) => (
                    <SelectItem key={depot.id} value={String(depot.id)}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Depot Rep')}</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select depot rep')} />
                </SelectTrigger>
                <SelectContent>
                  {(indexMeta?.depot_reps ?? []).map((rep) => (
                    <SelectItem key={rep.id} value={String(rep.id)}>
                      {rep.name ?? personName(rep, rep.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {t('Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete assignment?')}
        message={deleteState.message}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
