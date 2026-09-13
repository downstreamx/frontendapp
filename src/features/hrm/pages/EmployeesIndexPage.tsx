import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Download, Eye, Lock, Plus, Users } from 'lucide-react'
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
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { fetchHrmMeta, listEmployeesPaginated, type EmployeeRow } from '../hrm-api'
import { exportEmployeesCsv, formatEmploymentType } from '../employee-utils'
import { EmployeeFormPage } from './EmployeeFormPage'
import { paths } from '@/lib/paths'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'
import { useViewDialogFromQuery } from '@/hooks/use-view-dialog-from-query'
import { EmployeeShowPage } from './EmployeeShowPage'

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

export function EmployeesIndexPage() {
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

  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-employees')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-employees')
  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)
  const { viewId, isOpen: viewOpen, openView, closeView } = useViewDialogFromQuery(canView)
  const openCreate = () => setCreateOpen(true)

  usePageChrome({
    pageTitle: t('Employees'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Employees') }],
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
    queryKey: ['hrm', 'employees', listParams],
    queryFn: () => listEmployeesPaginated(listParams),
  })

  const metaQuery = useQuery({
    queryKey: ['hrm', 'create-meta'],
    queryFn: fetchHrmMeta,
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'hrm.employees.destroy',
      defaultMessage: t('Are you sure you want to delete this employee?'),
      onSuccess: () => {
        toast.success(t('Employee deleted'))
        void queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete employee'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [
    appliedFilters.branch_id !== 'all' ? appliedFilters.branch_id : '',
    appliedFilters.department_id !== 'all' ? appliedFilters.department_id : '',
    appliedFilters.employment_type,
    appliedFilters.gender,
  ].filter(Boolean).length

  const departmentOptions = useMemo(() => {
    const departments = metaQuery.data?.departments ?? []
    if (draftFilters.branch_id === 'all') return departments
    return departments.filter((d) => String(d.branch_id) === draftFilters.branch_id)
  }, [metaQuery.data?.departments, draftFilters.branch_id])

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

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'employee_id',
      header: t('Employee Id'),
      sortable: true,
      render: (_, row) =>
        canView ? (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => openView(row.id)}
          >
            {row.employee_id}
          </button>
        ) : (
          row.employee_id
        ),
    },
    {
      key: 'name',
      header: t('Name'),
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
                    onClick={() => openView(row.id)}
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
              onEdit={() => navigate(paths.hrm.employeeEdit(row.id))}
              onDelete={() => openDeleteDialog(row.id)}
            />
          </div>
        )
      },
    },
  ]

  const hasFilters = Boolean(toolbar.search || activeFilterCount > 0)

  return (
    <>
      <ModuleListCard
        title={t('Employees')}
        description={t('Manage staff records, org structure, and payroll inputs.')}
        actions={
          <div className="flex gap-2">
            {rows.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => exportEmployeesCsv(rows)}
              >
                <Download className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('Export')}</span>
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('Create')}</span>
            </Button>
          </div>
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
          searchPlaceholder: t('Search employees...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Branch')}</Label>
                <Select
                  value={draftFilters.branch_id}
                  onValueChange={(branch_id) =>
                    setDraftFilters({ branch_id, department_id: 'all', employment_type: draftFilters.employment_type, gender: draftFilters.gender })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by branch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All branches')}</SelectItem>
                    {(metaQuery.data?.branches ?? []).map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Department')}</Label>
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
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Employment Type')}</Label>
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
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Gender')}</Label>
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
            </>
          ),
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
            title={t('No employees found')}
            description={t('Get started by creating your first employee.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            createPermission="create-employees"
            onCreateClick={openCreate}
            createButtonText={t('Create employee')}
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
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t('Create Employee')}</DialogTitle>
          </DialogHeader>
          {createOpen ? (
            <EmployeeFormPage
              presentation="dialog"
              onCancel={() => setCreateOpen(false)}
              onSuccess={(saved) => {
                setCreateOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] })
                openView(saved.id)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={(open) => !open && closeView()}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t('Employee Details')}</DialogTitle>
          </DialogHeader>
          {viewId ? (
            <EmployeeShowPage
              presentation="dialog"
              entityId={viewId}
              onClose={closeView}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete employee')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
