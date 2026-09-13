import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, Lock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
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
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { EmployeeRow } from '@/features/hrm/hrm-api'
import { formatEmploymentType } from '@/features/hrm/employee-utils'
import { EmployeeFormPage } from '@/features/hrm/pages/EmployeeFormPage'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { fetchDriversIndexMeta, listDriversPaginated } from '../fleet-api'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'

type AppliedFilters = {
  branch_id: string
  department_id: string
  employment_type: string
  gender: string
}

const defaultFilters: AppliedFilters = {
  branch_id: 'all',
  department_id: 'all',
  employment_type: '',
  gender: '',
}

const EMPLOYMENT_FILTER_OPTIONS = ['Full Time', 'Part Time', 'Temporary', 'Contract'] as const
const GENDER_FILTER_OPTIONS = ['Male', 'Female', 'Other'] as const

export function DriversIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-drivers')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-employees')
  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)
  const openCreate = () => setCreateOpen(true)
  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-employees')

  usePageChrome({
    pageTitle: t('Drivers'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Drivers') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.branch_id !== 'all') params.branch_id = appliedFilters.branch_id
    if (appliedFilters.department_id !== 'all') params.department_id = appliedFilters.department_id
    if (appliedFilters.employment_type) params.employment_type = appliedFilters.employment_type
    if (appliedFilters.gender) params.gender = appliedFilters.gender
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'drivers', listParams],
    queryFn: () => listDriversPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'drivers', 'index-meta'],
    queryFn: fetchDriversIndexMeta,
    enabled: canManage,
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'hrm.employees.destroy',
      defaultMessage: t('Are you sure you want to delete this driver?'),
      onSuccess: () => {
        toast.success(t('The driver has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'drivers'] })
        void queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete driver'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const departmentOptions = useMemo(() => {
    const departments = indexMeta?.departments ?? []
    if (draftFilters.branch_id === 'all') return departments
    return departments.filter((d) => String(d.branch_id) === draftFilters.branch_id)
  }, [draftFilters.branch_id, indexMeta?.departments])

  const activeFilterCount = [
    appliedFilters.branch_id !== 'all' ? appliedFilters.branch_id : '',
    appliedFilters.department_id !== 'all' ? appliedFilters.department_id : '',
    appliedFilters.employment_type,
    appliedFilters.gender,
  ].filter(Boolean).length

  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      next.set('page', '1')
      return next
    })
  }

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'employee_id',
      header: t('Employee Id'),
      sortable: true,
      render: (_, row) =>
        canView ? (
          <Link to={paths.fleet.driverShow(row.id)} className="font-medium text-primary hover:underline">
            {row.employee_id}
          </Link>
        ) : (
          row.employee_id
        ),
    },
    {
      key: 'name',
      header: t('Employee Name'),
      render: (_, row) => (
        <TableUserAvatarCell avatar={row.user?.avatar} name={row.user?.name ?? '—'} size="sm" />
      ),
    },
    {
      key: 'branch',
      header: t('Branch'),
      render: (_, row) => row.branch?.branch_name ?? '—',
    },
    {
      key: 'department',
      header: t('Department'),
      render: (_, row) => row.department?.department_name ?? '—',
    },
    {
      key: 'designation',
      header: t('Designation'),
      render: (_, row) => row.designation?.designation_name ?? '—',
    },
    {
      key: 'employment_type',
      header: t('Employment Type'),
      render: (_, row) => formatEmploymentType(row.employment_type),
    },
    {
      key: 'date_of_joining',
      header: t('Date Of Joining'),
      sortable: true,
      render: (_, row) => (row.date_of_joining ? formatDate(row.date_of_joining) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => {
        if (row.user?.is_disable) {
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
            {canView ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    onClick={() => navigate(paths.fleet.driverShow(row.id))}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('View')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            <TableRowActions
              editPermission="edit-employees"
              deletePermission="delete-employees"
              onEdit={() => navigate(paths.fleet.driverEdit(row.id))}
              onDelete={() =>
                openDeleteDialog(
                  row.id,
                  t('Are you sure you want to delete "{{name}}"?', {
                    name: row.user?.name ?? row.employee_id,
                  }),
                )
              }
            />
          </div>
        )
      },
    },
  ]

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <>
      <ModuleListCard
        title={t('Drivers')}
        description={t('Manage fleet drivers (employees with Driver designation).')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search drivers...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>{t('Branch')}</Label>
                <Select
                  value={draftFilters.branch_id}
                  onValueChange={(branch_id) =>
                    setDraftFilters({
                      branch_id,
                      department_id: 'all',
                      employment_type: draftFilters.employment_type,
                      gender: draftFilters.gender,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by branch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All branches')}</SelectItem>
                    {(indexMeta?.branches ?? []).map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Department')}</Label>
                <Select
                  value={draftFilters.department_id}
                  onValueChange={(department_id) =>
                    setDraftFilters((prev) => ({ ...prev, department_id }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by department')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All departments')}</SelectItem>
                    {departmentOptions.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Employment Type')}</Label>
                <Select
                  value={draftFilters.employment_type || 'all'}
                  onValueChange={(employment_type) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      employment_type: employment_type === 'all' ? '' : employment_type,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by Employment Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    {EMPLOYMENT_FILTER_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Gender')}</Label>
                <Select
                  value={draftFilters.gender || 'all'}
                  onValueChange={(gender) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      gender: gender === 'all' ? '' : gender,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by Gender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    {GENDER_FILTER_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {t(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={pagination}
        onPageChange={(p) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(p))
            return next
          })
        }
      >
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            icon={Users}
            title={t('No drivers found')}
            description={t('Create an employee with the Driver designation to appear here.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            createPermission="create-employees"
            onCreateClick={openCreate}
            createButtonText={t('Create employee')}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t('Create Driver')}</DialogTitle>
          </DialogHeader>
          {createOpen ? (
            <EmployeeFormPage
              mode="driver"
              presentation="dialog"
              onCancel={() => setCreateOpen(false)}
              onSuccess={(saved) => {
                setCreateOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['fleet', 'drivers'] })
                navigate(paths.fleet.driverShow(saved.id))
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Driver')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
