import { Link } from 'react-router-dom'
import type { Column } from '@/components/ui/data-table'
import { formatShortDate, orgRolePath, personName } from '@/features/shared/lib/entity-labels'
import { TableRowActions } from '@/features/shared/components/TableRowActions'

export function employeeColumn(showPath?: (id: number) => string): Column<Record<string, unknown>> {
  return {
    key: 'employee',
    header: 'Employee',
    render: (_, row) => {
      const name = personName(
        row.employee as { name?: string; email?: string },
        row.employee_id as number,
      )
      const recordId = row.id as number | undefined
      if (showPath && recordId != null) {
        return (
          <Link to={showPath(recordId)} className="font-medium text-primary hover:underline">
            {name}
          </Link>
        )
      }
      return name
    },
  }
}

export function lifecycleActionsColumn(options: {
  onView: (id: number) => void
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (id: number) => void
  editPermission?: string
  deletePermission?: string
}): Column<Record<string, unknown>> {
  return {
    key: 'actions',
    header: 'Action',
    render: (_, row) => (
      <TableRowActions
        onView={row.id != null ? () => options.onView(Number(row.id)) : undefined}
        onEdit={options.onEdit ? () => options.onEdit!(row) : undefined}
        onDelete={options.onDelete && row.id != null ? () => options.onDelete!(Number(row.id)) : undefined}
        editPermission={options.editPermission}
        deletePermission={options.deletePermission}
      />
    ),
  }
}

export function statusColumn(): Column<Record<string, unknown>> {
  return {
    key: 'status',
    header: 'Status',
    render: (_, row) => String(row.status ?? '—'),
  }
}

export function transferPathColumn(
  prefix: 'from' | 'to',
  header: string,
): Column<Record<string, unknown>> {
  return {
    key: `${prefix}_path`,
    header,
    render: (_, row) =>
      orgRolePath({
        designation: row[`${prefix}_designation`] as { designation_name?: string },
        department: row[`${prefix}_department`] as { department_name?: string },
        branch: row[`${prefix}_branch`] as { branch_name?: string },
      }),
  }
}

export function dateColumn(key: string, header: string): Column<Record<string, unknown>> {
  return {
    key,
    header,
    render: (_, row) => formatShortDate(row[key] as string) || '—',
  }
}
