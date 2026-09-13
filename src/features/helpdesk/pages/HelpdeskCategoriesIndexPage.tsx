import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { listHelpdeskCategories } from '../helpdesk-api'

type HelpdeskCategoryRow = {
  id: number
  name: string
  description?: string
  color?: string
}

export function HelpdeskCategoriesIndexPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const listQuery = useQuery({
    queryKey: ['helpdesk', 'categories'],
    queryFn: listHelpdeskCategories,
  })

  const rows = (listQuery.data ?? []) as HelpdeskCategoryRow[]

  usePageChrome({
    pageTitle: t('Helpdesk categories'),
    breadcrumbs: [{ label: t('Helpdesk') }, { label: t('Categories') }],
  })

  const columns: Column<HelpdeskCategoryRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: row.color ?? '#6366f1' }}
          />
          <Link to={paths.helpdeskCategoryShow(row.id)} className="text-primary hover:underline">
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('Description'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <Link
          to={paths.helpdeskCategoryEdit(row.id)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('Edit')}
        </Link>
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('Helpdesk categories')}
      isLoading={listQuery.isLoading}
      actions={
        <div className="flex gap-2">
          <Link to={paths.helpdesk} className="self-center text-sm text-primary hover:underline">
            {t('Tickets')}
          </Link>
          <Button size="sm" onClick={() => navigate(paths.helpdeskCategoryCreate)}>
            {t('New category')}
          </Button>
        </div>
      }
    >
      {rows.length === 0 && !listQuery.isLoading ? (
        <NoRecordsFound
          icon={FolderOpen}
          title={t('No categories yet')}
          description={t('Create a helpdesk category to organize tickets.')}
          onCreateClick={() => navigate(paths.helpdeskCategoryCreate)}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
