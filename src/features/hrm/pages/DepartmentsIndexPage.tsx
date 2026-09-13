import { useMemo } from 'react'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { Column } from '@/components/ui/data-table'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { useHrmMeta } from '../hooks/use-hrm-meta'

type DepartmentRow = {
  id: number
  department_name: string
  branch_id?: number
  branch?: { branch_name: string }
}

export function DepartmentsIndexPage() {
  const { t } = useTranslation()
  const { branchOptions, isLoading: metaLoading } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'department_name', label: t('Department name'), required: true },
      {
        name: 'branch_id',
        label: t('Branch'),
        type: 'select',
        required: true,
        options: branchOptions,
        placeholder: metaLoading ? t('Loading…') : t('Select branch'),
      },
    ],
    [branchOptions, metaLoading, t],
  )

  const columns: Column<DepartmentRow>[] = useMemo(
    () => [
      { key: 'department_name', header: t('Department') },
      {
        key: 'branch',
        header: t('Branch'),
        render: (_v, row) => row.branch?.branch_name ?? '—',
      },
    ],
    [t],
  )

  return (
    <ResourceIndexPage
      title={t('Departments')}
      listKey="hrm-departments"
      apiEndpoint="/hrm/departments"
      labelKeys={['department_name', 'id']}
      emptyIcon={Building2}
      fields={fields}
      columns={columns as Column<Record<string, unknown>>[]}
      permissions={{
        create: 'create-departments',
        edit: 'edit-departments',
        delete: 'delete-departments',
      }}
    />
  )
}
