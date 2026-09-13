import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { Column } from '@/components/ui/data-table'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'

export function DistributionSystemSetupPage() {
  const { t } = useTranslation()

  const fields: CrudFieldDef[] = [
    { name: 'name', label: t('Name'), required: true },
    { name: 'code', label: t('Code (optional)') },
    {
      name: 'direction',
      label: t('Direction'),
      type: 'select',
      required: true,
      options: [
        { value: 'in', label: t('In (receipt)') },
        { value: 'out', label: t('Out (issue)') },
      ],
    },
  ]

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (_v, row) => (
        <span>
          <span className="font-medium">{String(row.name)}</span>
          {row.code ? (
            <span className="text-muted-foreground ml-2 font-mono text-xs">{String(row.code)}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'direction',
      header: t('Direction'),
      render: (v) => <span className="capitalize">{String(v)}</span>,
    },
  ]

  return (
    <ResourceIndexPage
      title={t('Movement types')}
      description={t('Configure inventory movement types used when recording stock movements.')}
      listKey="distribution-inventory-movement-types"
      apiEndpoint="/distribution/inventory-movement-types"
      labelKeys={['name', 'code']}
      emptyIcon={Target}
      fields={fields}
      columns={columns}
      permissions={{
        create: 'create-inventory-movement-types',
        edit: 'edit-inventory-movement-types',
        delete: 'delete-inventory-movement-types',
      }}
    />
  )
}
