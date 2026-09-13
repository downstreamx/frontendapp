import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { listRolesPaginated, type RoleListRow } from '../admin-api'
import { paths } from '@/lib/paths'

function UserChips({ users, t }: { users: RoleListRow['users']; t: (key: string) => string }) {
  if (!users.length) {
    return <span className="text-sm text-muted-foreground">{t('No users')}</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {users.slice(0, 5).map((user) => (
        <Badge key={user.id} variant="secondary" className="font-normal">
          {user.name}
        </Badge>
      ))}
      {users.length > 5 ? (
        <Badge variant="outline" className="font-normal">
          +{users.length - 5}
        </Badge>
      ) : null}
    </div>
  )
}

export function RolesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-roles')

  usePageChrome({
    pageTitle: t('Manage Roles'),
    breadcrumbs: [{ label: t('Roles') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.name = toolbar.search
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles', listParams],
    queryFn: () => listRolesPaginated(listParams),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'roles.destroy',
      defaultMessage: t('Are you sure you want to delete this role?'),
      onSuccess: () => {
        toast.success(t('The role has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['roles'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete role'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<RoleListRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'label',
      header: t('Label'),
      sortable: true,
      render: (_, row) => row.label,
    },
    {
      key: 'permissions_count',
      header: t('Permissions'),
      render: (_, row) => (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
          {row.permissions_count}
        </Badge>
      ),
    },
    {
      key: 'users',
      header: t('Users'),
      render: (_, row) => <UserChips users={row.users} t={t} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="edit-roles"
          deletePermission="delete-roles"
          onEdit={() => navigate(paths.roles.edit(row.id))}
          onDelete={row.editable ? () => openDeleteDialog(row.id) : undefined}
        />
      ),
    },
  ]

  const hasFilters = Boolean(toolbar.search)

  return (
    <>
      <ModuleListCard
        title={t('Roles')}
        description={t('Define access levels and assign permissions to users.')}
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link to={paths.roles.create}>
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('Create')}</span>
              </Link>
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: () => {
            toolbar.applySearch()
            const next = new URLSearchParams(searchParams)
            next.set('page', '1')
            setSearchParams(next)
          },
          searchPlaceholder: t('Search roles...'),
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onClearFilters: hasFilters
            ? () => {
                toolbar.setDraftSearch('')
                toolbar.applySearch(true)
                const next = new URLSearchParams(searchParams)
                next.delete('page')
                setSearchParams(next)
              }
            : undefined,
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
            icon={Shield}
            title={t('No roles found')}
            description={t('Get started by creating your first role.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
            }}
            createPermission="create-roles"
            onCreateClick={() => navigate(paths.roles.create)}
            createButtonText={t('Create Role')}
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

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Role')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
