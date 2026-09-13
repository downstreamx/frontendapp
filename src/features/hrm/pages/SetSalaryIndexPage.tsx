import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DollarSign, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EntitySelect } from '@/components/forms/entity-select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatCurrency } from '@/utils/helpers'
import { TableUserAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { listEmployeesPaginated, type EmployeeRow } from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function SetSalaryIndexPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const { employeeOptions } = useHrmMeta()
  const [employeeFilter, setEmployeeFilter] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-set-salary')

  usePageChrome({
    pageTitle: t('Set Salary'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Set Salary') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (employeeFilter) params.employee_id = employeeFilter
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [employeeFilter, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['hrm', 'set-salary', listParams],
    queryFn: () => listEmployeesPaginated(listParams),
    enabled: canView,
  })

  const columns: Column<EmployeeRow>[] = useMemo(
    () => [
      {
        key: 'employee_id',
        header: t('Employee ID'),
        render: (_, row) =>
          canView ? (
            <Link to={`/hrm/set-salary/${row.id}`} className="text-primary hover:underline">
              {row.employee_id ?? '—'}
            </Link>
          ) : (
            (row.employee_id ?? '—')
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
        key: 'basic_salary',
        header: t('Basic salary'),
        render: (_, row) =>
          row.basic_salary != null ? formatCurrency(Number(row.basic_salary)) : '—',
      },
      {
        key: 'actions',
        header: t('Action'),
        render: (_, row) =>
          canView ? (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/hrm/set-salary/${row.id}`} title={t('View salary setup')}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          ) : null,
      },
    ],
    [canView, t],
  )

  const rows = data?.data ?? []

  return (
    <ModuleListCard
      title={t('Set Salary')}
      description={t('Select an employee to manage salary components.')}
      isLoading={isLoading}
      error={Boolean(error)}
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
        filtersPanel: (
          <EntitySelect
            value={employeeFilter}
            onValueChange={setEmployeeFilter}
            options={[{ value: '', label: t('All') }, ...employeeOptions]}
            placeholder={t('Filter by employee')}
          />
        ),
      }}
      pagination={
        data?.meta
          ? {
              current_page: data.meta.current_page,
              last_page: data.meta.last_page,
              per_page: data.meta.per_page,
              total: data.meta.total,
              onPageChange: (p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              },
            }
          : undefined
      }
    >
      {rows.length === 0 && !isLoading ? (
        <NoRecordsFound
          icon={DollarSign}
          title={t('No employees found')}
          description={t('No employees are available for salary setup.')}
          className="h-auto py-8"
        />
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
