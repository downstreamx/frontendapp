import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/errors'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { getProject } from '../api'
import { ProjectActivityFeed } from '../components/ProjectActivityFeed'
import { ProjectDetailsCard } from '../components/ProjectDetailsCard'
import { ProjectFilesPanel } from '../components/ProjectFilesPanel'
import { ProjectHeader } from '../components/ProjectHeader'
import { ProjectMilestoneList } from '../components/ProjectMilestoneList'
import { ProjectStatsCards } from '../components/ProjectStatsCards'
import { ProjectTaskChart } from '../components/ProjectTaskChart'
import { ProjectTeamPanel } from '../components/ProjectTeamPanel'
import { projectDeleteMessage, useProjectDelete } from '../hooks/useProjectDelete'
import { ProjectKanbanPanel } from '../components/ProjectKanbanPanel'
import { PageContentLoader } from '@/components/ui/page-content-loader'

const TAB_VALUES = ['overview', 'tasks', 'bugs', 'milestones', 'team', 'files', 'activity'] as const
type TabValue = (typeof TAB_VALUES)[number]

function isTabValue(value: string | null): value is TabValue {
  return TAB_VALUES.includes(value as TabValue)
}

export function ProjectViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: TabValue = isTabValue(tabParam) ? tabParam : 'overview'

  const projectId = id && /^\d+$/.test(id) ? id : undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  })

  const project = data?.project
  const projectName = project?.name ?? t('Project')

  usePageChrome({
    pageTitle: projectName,
    breadcrumbs: [
      { label: t('Projects'), url: paths.taskly.projects },
      { label: projectName },
    ],
  })

  const permissions = useMemo(
    () => ({
      canEdit: hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-project'),
      canManageTasks: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'manage-project-task',
      ),
      canManageBugs: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'manage-project-bug',
      ),
      canInviteTeam: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'invite-project-member',
      ),
      canInviteClient: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'invite-project-client',
      ),
      canDeleteTeam: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'delete-project-member',
      ),
      canDeleteClient: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'delete-project-client',
      ),
      canManageMilestones: hasPermission(
        auth.permissions,
        auth.roles,
        auth.user?.type,
        'manage-project-milestone',
      ),
      canDelete: hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-project'),
    }),
    [auth.permissions, auth.roles, auth.user?.type],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useProjectDelete({
      onSuccess: () => {
        toast.success(t('The project has been deleted.'))
        navigate(paths.taskly.projects)
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete project'))),
    })

  useEffect(() => {
    if (!tabParam || isTabValue(tabParam)) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('tab')
      return next
    })
  }, [setSearchParams, tabParam])

  const setTab = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'overview') {
        next.delete('tab')
      } else {
        next.set('tab', value)
      }
      return next
    })
  }

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (error || !project) {
    return <p className="text-sm text-destructive">{t('Project not found.')}</p>
  }

  const stats = data.project_stats
  const team = project.team_members ?? project.teamMembers ?? []
  const clients = project.clients ?? []
  const logs = project.activity_logs ?? project.activityLogs ?? []
  const milestones = project.milestones ?? []
  const files = project.files ?? []
  const chartData = data.chart_data ?? []
  const chartLines = data.chart_lines ?? []

  return (
    <article className="space-y-6">
      <ProjectHeader
        project={project}
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
        canManageTasks={permissions.canManageTasks}
        canManageBugs={permissions.canManageBugs}
        onDelete={() => openDeleteDialog(project.id, projectDeleteMessage(t, project.name))}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('Tasks')}</TabsTrigger>
          <TabsTrigger value="bugs">{t('Bugs')}</TabsTrigger>
          <TabsTrigger value="milestones">{t('Milestones')}</TabsTrigger>
          <TabsTrigger value="team">{t('Team')}</TabsTrigger>
          <TabsTrigger value="files">{t('Files')}</TabsTrigger>
          <TabsTrigger value="activity">{t('Activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProjectDetailsCard project={project} canEdit={permissions.canEdit} />
            <ProjectStatsCards
              projectId={project.id}
              stats={stats}
              canManageTasks={permissions.canManageTasks}
              canManageBugs={permissions.canManageBugs}
            />
          </div>
          <ProjectTaskChart chartData={chartData} chartLines={chartLines} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 pt-4">
          {permissions.canManageTasks ? (
            <>
              <ProjectKanbanPanel projectId={String(project.id)} kind="tasks" embedded />
              <Button asChild variant="outline" size="sm">
                <Link to={paths.taskly.projectTasksKanban(project.id)}>{t('Full-screen kanban')}</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('You do not have permission to manage tasks.')}</p>
          )}
        </TabsContent>

        <TabsContent value="bugs" className="space-y-4 pt-4">
          {permissions.canManageBugs ? (
            <>
              <ProjectKanbanPanel projectId={String(project.id)} kind="bugs" embedded />
              <Button asChild variant="outline" size="sm">
                <Link to={paths.taskly.projectBugsKanban(project.id)}>{t('Full-screen kanban')}</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('You do not have permission to manage bugs.')}</p>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="pt-4">
          {permissions.canManageMilestones ? (
            <ProjectMilestoneList projectId={project.id} milestones={milestones} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('You do not have permission to view milestones.')}</p>
          )}
        </TabsContent>

        <TabsContent value="team" className="pt-4">
          <ProjectTeamPanel
            projectId={project.id}
            team={team}
            clients={clients}
            availableTeam={data.available_team_members}
            availableClients={data.available_clients}
            canInviteTeam={permissions.canInviteTeam}
            canInviteClient={permissions.canInviteClient}
            canDeleteTeam={permissions.canDeleteTeam}
            canDeleteClient={permissions.canDeleteClient}
          />
        </TabsContent>

        <TabsContent value="files" className="pt-4">
          <ProjectFilesPanel projectId={project.id} files={files} />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ProjectActivityFeed logs={logs} />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Project')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </article>
  )
}
