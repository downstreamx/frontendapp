import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { Column } from '@/components/ui/data-table'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { useHrmMeta } from '../hooks/use-hrm-meta'

type DesignationRow = {
  id: number
  designation_name: string
  branch_id?: number
  department_id?: number
  branch?: { branch_name: string }
  department?: { department_name: string }
}

export function DesignationsIndexPage() {
  const { t } = useTranslation()
  const { branchOptions, meta } = useHrmMeta()

  const departmentOptions = useMemo(() => {
    if (!meta) return []
    const branchNames = new Map(meta.branches.map((b) => [b.id, b.branch_name]))
    return meta.departments.map((d) => ({
      id: d.id,
      label: `${d.department_name} (${branchNames.get(d.branch_id) ?? '—'})`,
    }))
  }, [meta])

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'designation_name', label: t('Designation name'), required: true },
      {
        name: 'branch_id',
        label: t('Branch'),
        type: 'select',
        required: true,
        options: branchOptions,
        placeholder: t('Select branch'),
      },
      {
        name: 'department_id',
        label: t('Department'),
        type: 'select',
        required: true,
        options: departmentOptions,
        placeholder: t('Select department'),
      },
    ],
    [branchOptions, departmentOptions, t],
  )

  const columns: Column<DesignationRow>[] = useMemo(
    () => [
      { key: 'designation_name', header: t('Designation') },
      {
        key: 'department',
        header: t('Department'),
        render: (_v, row) => row.department?.department_name ?? '—',
      },
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
      title={t('Designations')}
      listKey="hrm-designations"
      apiEndpoint="/hrm/designations"
      labelKeys={['designation_name', 'id']}
      emptyIcon={Users}
      fields={fields}
      columns={columns as Column<Record<string, unknown>>[]}
      permissions={{
        create: 'create-designations',
        edit: 'edit-designations',
        delete: 'delete-designations',
      }}
    />
  )
}
