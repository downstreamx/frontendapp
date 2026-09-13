import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, statusColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

const showPath = (id: number | string) => `/hrm/acknowledgments/${id}`

export function AcknowledgmentsIndexPage() {
  const { employeeOptions, hrmDocumentOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'document_id', label: 'Document', type: 'select', options: hrmDocumentOptions },
      { name: 'acknowledgment_note', label: 'Note' },
    ],
    [employeeOptions, hrmDocumentOptions],
  )

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      employeeColumn(),
      {
        key: 'document',
        header: 'Document',
        render: (_, row) => {
          const doc = row.document as { id?: number; title?: string } | undefined
          if (doc?.id) {
            return (
              <Link to={`/hrm/documents/${doc.id}`} className="text-primary hover:underline">
                {doc.title ?? '—'}
              </Link>
            )
          }
          return '—'
        },
      },
      statusColumn(),
    ],
    [],
  )

  return (
    <ResourceIndexPage
      title="Acknowledgments"
      listKey="hrm-acknowledgments"
      apiEndpoint="/hrm/acknowledgments"
      labelKeys={['id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
