import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bug, Kanban, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import type { ProjectRecord } from '../api'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'

type Props = {
  project: ProjectRecord
  canEdit?: boolean
  canDelete?: boolean
  canManageTasks?: boolean
  canManageBugs?: boolean
  onDelete?: () => void
}

export function ProjectHeader({
  project,
  canEdit,
  canDelete,
  canManageTasks,
  canManageBugs,
  onDelete,
}: Props) {
  const { t } = useTranslation()

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.start_date && formatDate(project.start_date)}
          {project.end_date ? ` — ${formatDate(project.end_date)}` : ''}
        </p>
        {project.status ? (
          <div className="mt-2">
            <ProjectStatusBadge status={project.status} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canEdit ? (
          <Button asChild variant="outline" size="sm">
            <Link to={paths.taskly.projectEdit(project.id)}>
              <Pencil className="mr-1 h-4 w-4" />
              {t('Edit')}
            </Link>
          </Button>
        ) : null}
        {canManageTasks ? (
          <Button asChild variant="outline" size="sm">
            <Link to={paths.taskly.projectTasksKanban(project.id)}>
              <Kanban className="mr-1 h-4 w-4" />
              {t('Tasks kanban')}
            </Link>
          </Button>
        ) : null}
        {canManageBugs ? (
          <Button asChild variant="outline" size="sm">
            <Link to={paths.taskly.projectBugsKanban(project.id)}>
              <Bug className="mr-1 h-4 w-4" />
              {t('Bugs kanban')}
            </Link>
          </Button>
        ) : null}
        {canDelete && onDelete ? (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            {t('Delete')}
          </Button>
        ) : null}
        <Link
          to={paths.taskly.projects}
          className="self-center text-sm text-primary hover:underline"
        >
          {t('Back to projects')}
        </Link>
      </div>
    </header>
  )
}
