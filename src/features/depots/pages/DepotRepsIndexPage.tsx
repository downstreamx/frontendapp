import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoRecordsFound } from '@/components/no-records-found'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import type { EmployeeRow } from '@/features/hrm/hrm-api'
import { fetchDepotRepsIndexMeta, listDepotRepsPaginated } from '../depot-rep-api'
import { EmployeeFormPage } from '@/features/hrm/pages/EmployeeFormPage'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'
import { personName } from '@/features/shared/lib/entity-labels'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'

export function DepotRepsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-depot-reps')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-depot-reps')
  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)
  const openCreate = () => setCreateOpen(true)

  usePageChrome({
    pageTitle: t('Depot Reps'),
    breadcrumbs: [{ label: t('Depots') }, { label: t('Depot Reps') }],
  })

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      search: toolbar.appliedSearch || undefined,
    }),
    [toolbar.appliedSearch, toolbar.perPage, page],
  )

  const { data: indexMeta } = useQuery({
    queryKey: ['depot-reps', 'index-meta'],
    queryFn: fetchDepotRepsIndexMeta,
    enabled: canManage,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['depot-reps', listParams],
    queryFn: () => listDepotRepsPaginated(listParams),
    enabled: canManage,
  })

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'employee_id',
      header: t('Employee ID'),
      sortable: true,
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'user',
      header: t('Name'),
      render: (_, row) => (
        <TableUserAvatarCell
          avatar={row.user?.avatar}
          name={personName(row.user, row.id)}
        />
      ),
    },
    {
      key: 'branch',
      header: t('Branch'),
      render: (_, row) => row.branch?.branch_name ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <Link className="text-sm text-primary hover:underline" to={paths.depots.depotRepShow(row.id)}>
          {t('View')}
        </Link>
      ),
    },
  ]

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <>
    <ModuleListCard
      title={t('Depot Reps')}
      description={t('Staff designated to approve bridging and manage depot schedules.')}
      canCreate={canCreate}
      onCreateClick={openCreate}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: toolbar.applySearch,
        searchPlaceholder: t('Search depot reps...'),
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
      }}
    >
      {data?.rows.length ? (
        <DataTable columns={columns} data={data.rows} embedded />
      ) : (
        <NoRecordsFound message={t('No depot reps found.')} />
      )}
    </ModuleListCard>

    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('Create Depot Rep')}</DialogTitle>
        </DialogHeader>
        {createOpen ? (
          <EmployeeFormPage
            mode="depot-rep"
            presentation="dialog"
            onCancel={() => setCreateOpen(false)}
            onSuccess={(saved) => {
              setCreateOpen(false)
              void queryClient.invalidateQueries({ queryKey: ['depot-reps'] })
              navigate(paths.depots.depotRepShow(saved.id))
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  )
}
