import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, FolderKanban, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { projectDeleteMessage, useProjectDelete } from '../hooks/useProjectDelete'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { ProjectDuplicateDialog } from '../components/ProjectDuplicateDialog'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { ProjectTeamAvatars } from '../components/ProjectTeamAvatars'
import {
  duplicateProject,
  listProjectsPaginated,
  PROJECT_STATUSES,
  updateProjectStatus,
  type ProjectListRow,
} from '../taskly-api'
import { ProjectFormPage } from './ProjectFormPage'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'

type AppliedFilters = {
  status: string
  date: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  date: '',
}

export function ProjectsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [duplicateProjectRow, setDuplicateProjectRow] = useState<ProjectListRow | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-project')
  const canDuplicate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'duplicate-project')
  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)

  const openCreate = () => setCreateOpen(true)

  usePageChrome({
    pageTitle: t('Manage Project'),
    breadcrumbs: [{ label: t('Project') }, { label: t('Projects') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.name = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.date) params.date = appliedFilters.date
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['taskly', 'projects', listParams],
    queryFn: () => listProjectsPaginated(listParams),
  })

  const duplicateMutation = useMutation({
    mutationFn: ({ id, options }: { id: number; options: Parameters<typeof duplicateProject>[1] }) =>
      duplicateProject(id, options),
    onSuccess: (result) => {
      toast.success(t('The project has been duplicated successfully.'))
      setDuplicateProjectRow(null)
      void queryClient.invalidateQueries({ queryKey: ['taskly', 'projects'] })
      navigate(paths.taskly.projectShow(result.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to duplicate project'))),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateProjectStatus(id, status),
    onSuccess: () => {
      toast.success(t('Project status updated'))
      void queryClient.invalidateQueries({ queryKey: ['taskly', 'projects'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update project status'))),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useProjectDelete({
      onSuccess: () => {
        toast.success(t('The project has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['taskly', 'projects'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete project'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [appliedFilters.status, appliedFilters.date].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<ProjectListRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <Link
          to={paths.taskly.projectShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'team_members',
      header: t('Users'),
      render: (_, row) => <ProjectTeamAvatars members={row.team_members} />,
    },
    {
      key: 'budget',
      header: t('Budget'),
      sortable: true,
      render: (_, row) => (row.budget != null && row.budget !== '' ? formatCurrency(row.budget) : '—'),
    },
    {
      key: 'start_date',
      header: t('Start Date'),
      sortable: true,
      render: (_, row) => (row.start_date ? formatDate(row.start_date) : '—'),
    },
    {
      key: 'end_date',
      header: t('End Date'),
      sortable: true,
      render: (_, row) => {
        if (!row.end_date) return '—'
        const overdue = new Date(row.end_date) < new Date()
        return (
          <span className={overdue ? 'text-destructive' : undefined}>{formatDate(row.end_date)}</span>
        )
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <ProjectStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {canDuplicate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
              onClick={() => setDuplicateProjectRow(row)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PROJECT_STATUSES.filter((s) => s !== row.status).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => statusMutation.mutate({ id: row.id, status })}
                >
                  {t('Set status')}: {t(status)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <TableRowActions
            viewPermission="view-project"
            editPermission="edit-project"
            deletePermission="delete-project"
            onView={() => navigate(paths.taskly.projectShow(row.id))}
            onEdit={() => navigate(paths.taskly.projectEdit(row.id))}
            onDelete={() => openDeleteDialog(row.id, projectDeleteMessage(t, row.name))}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Projects')}
        description={t('Plan, track, and deliver work across your team.')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search projects...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Active on date')}</Label>
                <Input
                  type="date"
                  value={draftFilters.date}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" size="sm" onClick={applyFilters}>
                  {t('Apply')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  {t('Clear')}
                </Button>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={
          pagination
            ? {
                ...pagination,
                onPageChange: (p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(p))
                  setSearchParams(next)
                },
              }
            : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={FolderKanban}
            title={t('No projects found')}
            description={t('Get started by creating your first project.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            createPermission="create-project"
            onCreateClick={openCreate}
            createButtonText={t('Create project')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable
            embedded
            columns={columns}
            data={rows}
            sortKey={sortField || undefined}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Create Project')}</DialogTitle>
          </DialogHeader>
          {createOpen ? (
            <ProjectFormPage
              presentation="dialog"
              onCancel={() => setCreateOpen(false)}
              onSuccess={(saved) => {
                setCreateOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['taskly', 'projects'] })
                navigate(paths.taskly.projectShow(saved.id))
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ProjectDuplicateDialog
        project={duplicateProjectRow}
        open={Boolean(duplicateProjectRow)}
        isPending={duplicateMutation.isPending}
        onOpenChange={(open) => !open && setDuplicateProjectRow(null)}
        onConfirm={(id, options) => duplicateMutation.mutate({ id, options })}
      />

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Project')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
