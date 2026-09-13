import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import type { ProjectRecord } from '../api'

type Props = {
  project: ProjectRecord
  canEdit?: boolean
}

export function ProjectDetailsCard({ project, canEdit }: Props) {
  const { t } = useTranslation()
  const endDate = project.end_date ? new Date(project.end_date) : null
  const isOverdue = endDate ? endDate < new Date() : false

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('Project Details')}</CardTitle>
        {canEdit ? (
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.taskly.projectEdit(project.id)}>
              <Pencil className="mr-1 h-4 w-4" />
              {t('Edit')}
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t('Status')}</span>
          {project.status ? <ProjectStatusBadge status={project.status} /> : '—'}
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t('Start Date')}</span>
          <span>{project.start_date ? formatDate(project.start_date) : '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t('End Date')}</span>
          <span className={isOverdue ? 'text-destructive' : undefined}>
            {project.end_date ? formatDate(project.end_date) : '—'}
          </span>
        </div>
        {project.description ? (
          <div className="border-t pt-3">
            <p className="mb-1 text-muted-foreground">{t('Description')}</p>
            <p className="whitespace-pre-wrap">{project.description}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
