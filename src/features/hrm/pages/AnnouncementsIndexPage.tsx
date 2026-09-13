import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { dateColumn, statusColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

const showPath = (id: number | string) => `/hrm/announcements/${id}`

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export function AnnouncementsIndexPage() {
  const { announcementCategoryOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'title', label: 'Title', required: true },
      { name: 'announcement_category_id', label: 'Category', type: 'select', options: announcementCategoryOptions },
      { name: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'priority', label: 'Priority', type: 'select', options: priorityOptions },
      { name: 'description', label: 'Description', type: 'richtext' },
    ],
    [announcementCategoryOptions],
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
        key: 'announcement_category',
        header: 'Category',
        render: (_, row) =>
          String(
            (row.announcement_category as { announcement_category?: string })?.announcement_category ?? '—',
          ),
      },
      dateColumn('start_date', 'Starts'),
      statusColumn(),
    ],
    [],
  )

  return (
    <ResourceIndexPage
      title="Announcements"
      listKey="hrm-announcements"
      apiEndpoint="/hrm/announcements"
      labelKeys={['title', 'id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
