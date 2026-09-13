import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { dateColumn, statusColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

const showPath = (id: number | string) => `/hrm/events/${id}`

export function EventsIndexPage() {
  const { eventTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'title', label: 'Title', required: true },
      { name: 'event_type_id', label: 'Type', type: 'select', options: eventTypeOptions },
      { name: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'start_time', label: 'Start time', type: 'time' },
      { name: 'end_time', label: 'End time', type: 'time' },
      { name: 'location', label: 'Location' },
      { name: 'description', label: 'Description', type: 'richtext' },
    ],
    [eventTypeOptions],
  )

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Title',
        render: (_, row) =>
          row.id != null ? (
            <Link to={showPath(row.id as number)} className="font-medium text-primary hover:underline">
              {String(row.title ?? '—')}
            </Link>
          ) : (
            String(row.title ?? '—')
          ),
      },
      {
        key: 'event_type',
        header: 'Type',
        render: (_, row) => String((row.event_type as { event_type?: string })?.event_type ?? '—'),
      },
      dateColumn('start_date', 'Starts'),
      statusColumn(),
    ],
    [],
  )

  return (
    <ResourceIndexPage
      title="Events"
      listKey="hrm-events"
      apiEndpoint="/hrm/events"
      labelKeys={['title', 'id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
