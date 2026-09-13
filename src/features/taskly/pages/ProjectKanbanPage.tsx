import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { ProjectKanbanPanel } from '../components/ProjectKanbanPanel'
import {
  fetchProjectBugsKanban,
  fetchProjectTasksKanban,
} from '../taskly-kanban-api'

type Props = { kind: 'tasks' | 'bugs' }

export function ProjectKanbanPage({ kind }: Props) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['taskly', kind, 'kanban', id],
    queryFn: () =>
      kind === 'tasks' ? fetchProjectTasksKanban(id!) : fetchProjectBugsKanban(id!),
    enabled: Boolean(id),
  })

  const projectName = data?.project.name ?? t('Project')
  const pageTitle = kind === 'tasks' ? t('Tasks kanban') : t('Bugs kanban')

  usePageChrome({
    pageTitle: `${projectName} — ${pageTitle}`,
    breadcrumbs: [
      { label: t('Projects'), url: paths.taskly.projects },
      { label: projectName, url: id ? paths.taskly.projectShow(id) : paths.taskly.projects },
      { label: pageTitle },
    ],
  })

  if (!id) return null

  return <ProjectKanbanPanel projectId={id} kind={kind} />
}
