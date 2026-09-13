import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Edit,
  History,
  Key,
  Lock,
  Plus,
  Settings2,
  Trash2,
  User as UserIcon,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { setAuthToken } from '@/lib/api'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { resolvePostAuthPath } from '@/lib/resolve-post-auth-path'
import { TableAvatarMedia, UserAvatar } from '@/features/shared/components/table-avatar-cells'
import {
  createUser,
  fetchUserCreateMeta,
  fetchUserForEdit,
  fetchUsersIndexMeta,
  impersonateUser,
  listUsersPaginated,
  updateUser,
  type UserListRow,
} from '../admin-api'
import {
  emptyUserForm,
  avatarForUserForm,
  UserFormFields,
  type UserFormState,
} from '../components/UserFormFields'

type AppliedFilters = {
  email: string
  role: string
  is_enable_login: string
}

const defaultFilters: AppliedFilters = {
  email: '',
  role: '',
  is_enable_login: '',
}

function LoginStatusBadge({ enabled, t }: { enabled: boolean; t: (key: string) => string }) {
  return (
    <Badge
      variant="outline"
      className={
        enabled
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }
    >
      {enabled ? t('Enabled') : t('Disabled')}
    </Badge>
  )
}

function ListEntityAvatar({
  avatar,
  name,
  fallbackIcon: FallbackIcon = UserIcon,
  circular = false,
}: {
  avatar: string | null
  name: string
  fallbackIcon?: typeof UserIcon
  circular?: boolean
}) {
  if (FallbackIcon === UserIcon && circular) {
    return <UserAvatar avatar={avatar} name={name} size="md" />
  }

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center overflow-hidden border bg-muted ${
        circular ? 'rounded-full' : 'rounded-lg'
      }`}
    >
      <TableAvatarMedia
        src={avatar}
        fallback={FallbackIcon}
        alt={name}
        iconClassName="h-5 w-5 text-muted-foreground"
        objectFit={circular ? 'cover' : 'contain'}
      />
    </div>
  )
}

export function UsersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyUserForm)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-users')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-users')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-users')
  const canChangePassword = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'change-password-users',
  )
  const canImpersonate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'impersonate-users',
  )
  const canViewLoginHistory = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-login-history',
  )
  const canFilterByRole = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-roles')

  const metaQuery = useQuery({
    queryKey: ['users', 'index-meta'],
    queryFn: fetchUsersIndexMeta,
  })

  const companiesContext =
    auth.user?.type === 'superadmin' || Boolean(metaQuery.data?.companies_context)

  const isEdit = editingId != null

  const { data: createMeta, isLoading: createMetaLoading } = useQuery({
    queryKey: ['users', 'create-meta'],
    queryFn: fetchUserCreateMeta,
    enabled: dialogOpen && !isEdit,
  })

  const { data: editMeta, isLoading: editMetaLoading } = useQuery({
    queryKey: ['users', editingId, 'edit'],
    queryFn: () => fetchUserForEdit(String(editingId)),
    enabled: dialogOpen && isEdit && editingId != null,
  })

  const formRoles = isEdit ? (editMeta?.roles ?? {}) : (createMeta?.roles ?? {})

  useEffect(() => {
    if (!dialogOpen || isEdit || !createMeta) return
    const firstRoleId = Object.keys(createMeta.roles)[0] ?? ''
    setForm((prev) => ({ ...prev, role_id: firstRoleId }))
  }, [createMeta, dialogOpen, isEdit])

  useEffect(() => {
    if (!dialogOpen || !isEdit || !editMeta) return
    const profile = editMeta.company_profile
    setForm({
      company_name: profile?.company_name ?? '',
      company_address: profile?.company_address ?? '',
      company_city: profile?.company_city ?? '',
      company_state: profile?.company_state ?? '',
      company_country: profile?.company_country || 'Nigeria',
      first_name: editMeta.user.first_name ?? '',
      middle_name: editMeta.user.middle_name ?? '',
      last_name: editMeta.user.last_name ?? '',
      email: editMeta.user.email,
      mobile_no: editMeta.user.mobile_no ?? '',
      password: '',
      password_confirmation: '',
      role_id: editMeta.role_id ? String(editMeta.role_id) : '',
      avatar: avatarForUserForm(editMeta.user.avatar),
      is_enable_login: editMeta.user.is_enable_login,
    })
  }, [dialogOpen, editMeta, isEdit])

  usePageChrome({
    pageTitle: companiesContext ? t('Manage Companies') : t('Manage Users'),
    breadcrumbs: [{ label: companiesContext ? t('Companies') : t('Users') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.name = toolbar.search
    if (appliedFilters.email) params.email = appliedFilters.email
    if (appliedFilters.role) params.role = appliedFilters.role
    if (appliedFilters.is_enable_login !== '') params.is_enable_login = appliedFilters.is_enable_login
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', listParams],
    queryFn: () => listUsersPaginated(listParams),
  })

  const impersonateMutation = useMutation({
    mutationFn: impersonateUser,
    onSuccess: (result) => {
      setAuthToken(result.token)
      queryClient.setQueryData(queryKeys.auth.me(), {
        ...result.me,
        impersonating: true,
      })
      toast.success(t('You are now login as user :name', { name: result.me.user.name }))
      navigate(resolvePostAuthPath(result.me), { replace: true })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to impersonate user'))),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit && editingId != null) {
        const payload = {
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          last_name: form.last_name,
          email: form.email,
          mobile_no: form.mobile_no || undefined,
          role_id: form.role_id ? Number(form.role_id) : undefined,
          is_enable_login: form.is_enable_login,
          ...(companiesContext
            ? {
                company_name: form.company_name,
                company_address: form.company_address || undefined,
                company_city: form.company_city || undefined,
                company_state: form.company_state || undefined,
                company_country: form.company_country || 'Nigeria',
              }
            : { avatar: form.avatar || null }),
        }
        return updateUser(String(editingId), payload)
      }
      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        email: form.email,
        mobile_no: form.mobile_no || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
        is_enable_login: form.is_enable_login,
        ...(companiesContext
          ? {
              company_name: form.company_name,
              company_address: form.company_address || undefined,
              company_city: form.company_city || undefined,
              company_state: form.company_state || undefined,
              company_country: form.company_country || 'Nigeria',
            }
          : { avatar: form.avatar || undefined }),
      }
      if (!companiesContext && form.role_id) {
        return createUser({ ...payload, role_id: Number(form.role_id) })
      }
      return createUser(payload)
    },
    onSuccess: (result) => {
      toast.success(
        isEdit
          ? t('The user details are updated successfully.')
          : companiesContext
            ? t('Company created. Continuing setup…')
            : t('The user has been created successfully.'),
      )
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      closeUserDialog()
      if (
        !isEdit &&
        companiesContext &&
        result &&
        'company_id' in result &&
        result.company_id != null &&
        result.needs_provisioning
      ) {
        navigate(paths.users.provisioning(result.id, result.company_id))
      }
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, isEdit ? t('Failed to update user') : t('Failed to create user')),
      ),
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'users.destroy',
      defaultMessage: t('Are you sure you want to delete this user?'),
      onSuccess: () => {
        toast.success(t('The user has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete user'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const roleOptions = metaQuery.data?.roles ?? {}

  const activeFilterCount = [
    appliedFilters.email,
    appliedFilters.role,
    appliedFilters.is_enable_login,
  ].filter(Boolean).length

  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const closeUserDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyUserForm())
  }

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyUserForm())
    setDialogOpen(true)
  }

  const openEditDialog = (id: number) => {
    setEditingId(id)
    setForm(emptyUserForm())
    setDialogOpen(true)
  }

  const submitUserForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit) {
      if (!form.password || form.password !== form.password_confirmation) {
        toast.error(t('Passwords do not match'))
        return
      }
      if (!form.role_id && !companiesContext) {
        toast.error(t('Role is required.'))
        return
      }
    }
    if (companiesContext && !form.company_name.trim()) {
      toast.error(t('Company name is required.'))
      return
    }
    saveMutation.mutate()
  }

  const formMetaLoading = isEdit ? editMetaLoading : createMetaLoading
  const editDisabled = isEdit && editMeta?.user.is_disable

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

  const renderRowActions = (row: UserListRow) => {
    if (row.is_disable) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('User is disabled')}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <div className="flex gap-1">
        {companiesContext && row.needs_provisioning && row.company_id != null ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-800"
                onClick={() => navigate(paths.users.provisioning(row.id, row.company_id!))}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Continue setup')}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {canImpersonate && row.id !== auth.user?.id ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                disabled={impersonateMutation.isPending}
                onClick={() => impersonateMutation.mutate(row.id)}
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Login As User')}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {canChangePassword ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                onClick={() => navigate(paths.users.changePassword(row.id))}
              >
                <Key className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Change Password')}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {canEdit ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                onClick={() => openEditDialog(row.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Edit')}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {canDelete ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => openDeleteDialog(row.id)}
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
    )
  }

  const columns: Column<UserListRow>[] = [
    {
      key: companiesContext ? 'company_logo' : 'avatar',
      header: companiesContext ? t('Logo') : t('Avatar'),
      render: (_, row) => (
        <ListEntityAvatar
          avatar={companiesContext ? row.company_logo ?? null : row.avatar}
          name={companiesContext ? row.company_name ?? row.name : row.name}
          fallbackIcon={companiesContext ? Building2 : UserIcon}
          circular={!companiesContext}
        />
      ),
    },
    {
      key: companiesContext ? 'company_name' : 'name',
      header: companiesContext ? t('Company Name') : t('Name'),
      sortable: true,
      render: (_, row) => (
        <span className="font-medium">
          {companiesContext ? row.company_name || row.name : row.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: t('Email'),
      sortable: true,
      render: (_, row) => row.email,
    },
    {
      key: 'mobile_no',
      header: t('Mobile No'),
      render: (_, row) => row.mobile_no ?? '—',
    },
    {
      key: 'type',
      header: t('Role'),
      sortable: true,
      render: (_, row) => (
        <Badge variant="secondary" className="font-normal capitalize">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'is_enable_login',
      header: t('Login Status'),
      sortable: true,
      render: (_, row) => <LoginStatusBadge enabled={row.is_enable_login} t={t} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => renderRowActions(row),
    },
  ]

  const headerActions = (
    <div className="flex gap-2">
      {canViewLoginHistory ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.users.loginHistory}>
                <History className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('User Login History')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {canCreate ? (
        <Button type="button" size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('Create')}</span>
        </Button>
      ) : null}
    </div>
  )

  return (
    <>
      <ModuleListCard
        title={companiesContext ? t('Companies') : t('Users')}
        description={
          companiesContext
            ? t('Manage company accounts, modules, and login access.')
            : t('Manage team members, roles, and login access.')
        }
        actions={headerActions}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: companiesContext ? t('Search companies...') : t('Search users...'),
          showFilters,
          onToggleFilters: () => setShowFilters((v) => !v),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>{t('Email')}</Label>
                <Input
                  placeholder={t('Filter by email')}
                  value={draftFilters.email}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              {canFilterByRole && !companiesContext ? (
                <div className="space-y-1">
                  <Label>{t('Role')}</Label>
                  <Select
                    value={draftFilters.role || 'all'}
                    onValueChange={(value) =>
                      setDraftFilters((f) => ({ ...f, role: value === 'all' ? '' : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Filter by role')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All roles')}</SelectItem>
                      {Object.entries(roleOptions).map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-1">
                <Label>{t('Login Status')}</Label>
                <Select
                  value={draftFilters.is_enable_login || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({
                      ...f,
                      is_enable_login: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by login status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    <SelectItem value="1">{t('Enabled')}</SelectItem>
                    <SelectItem value="0">{t('Disabled')}</SelectItem>
                  </SelectContent>
                </Select>
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
            icon={Users}
            title={companiesContext ? t('No companies found') : t('No users found')}
            description={
              companiesContext
                ? t('Get started by creating your first company.')
                : t('Get started by creating your first user.')
            }
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            createPermission="create-users"
            onCreateClick={openCreateDialog}
            createButtonText={companiesContext ? t('Create Company') : t('Create User')}
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeUserDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {companiesContext
                ? isEdit
                  ? t('Edit Company')
                  : t('Create Company')
                : isEdit
                  ? t('Edit User')
                  : t('Create User')}
            </DialogTitle>
          </DialogHeader>
          {formMetaLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : editDisabled ? (
            <p className="text-sm text-muted-foreground">{t('User is disabled')}</p>
          ) : (
            <form onSubmit={submitUserForm} className="space-y-4">
              <UserFormFields
                form={form}
                onChange={setForm}
                isEdit={isEdit}
                companiesContext={companiesContext}
                roles={formRoles}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeUserDialog}>
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? isEdit
                      ? t('Updating...')
                      : t('Creating...')
                    : isEdit
                      ? t('Update')
                      : t('Create')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete User')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
