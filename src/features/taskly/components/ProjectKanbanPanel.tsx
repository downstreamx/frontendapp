import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bug, Kanban, Plus } from 'lucide-react'
import { toast } from 'sonner'
import KanbanBoard, { type KanbanColumn, type KanbanTask } from '@/components/kanban-board'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  createProjectBug,
  createProjectTask,
  fetchProjectBugsKanban,
  fetchProjectTasksKanban,
  moveProjectBug,
  moveProjectTask,
} from '../taskly-kanban-api'

type Props = {
  projectId: string
  kind: 'tasks' | 'bugs'
  embedded?: boolean
}

export function ProjectKanbanPanel({ projectId, kind, embedded = false }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [createStageKey, setCreateStageKey] = useState('')

  const queryKey = ['taskly', kind, 'kanban', projectId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      kind === 'tasks'
        ? fetchProjectTasksKanban(projectId)
        : fetchProjectBugsKanban(projectId),
    enabled: Boolean(projectId),
  })

  const pageTitle = kind === 'tasks' ? t('Tasks kanban') : t('Bugs kanban')
  const Icon = kind === 'tasks' ? Kanban : Bug

  const columns: KanbanColumn[] = useMemo(
    () =>
      (data?.stages ?? []).map((stage) => ({
        id: stage.key,
        title: stage.name,
        color: stage.color,
      })),
    [data?.stages],
  )

  const stageIdByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const stage of data?.stages ?? []) {
      map.set(stage.key, stage.id)
    }
    return map
  }, [data?.stages])

  const moveMutation = useMutation({
    mutationFn: ({ taskId, stageId }: { taskId: number; stageId: number }) =>
      kind === 'tasks'
        ? moveProjectTask(projectId, taskId, stageId)
        : moveProjectBug(projectId, taskId, stageId),
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to move card'))),
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; stage_id?: number }) =>
      kind === 'tasks' ? createProjectTask(projectId, payload) : createProjectBug(projectId, payload),
    onSuccess: () => {
      toast.success(t('Created'))
      setCreateOpen(false)
      setTitle('')
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create'))),
  })

  const handleMove = (taskId: number, _from: string, toColumn: string) => {
    const stageId = stageIdByKey.get(toColumn)
    if (!stageId) return
    moveMutation.mutate({ taskId, stageId })
  }

  const openCreate = (columnId: string) => {
    setCreateStageKey(columnId)
    setCreateOpen(true)
  }

  if (isLoading) {
    return <PageContentLoader label={t('Loading board…')} className="min-h-[16rem]" />
  }

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={paths.taskly.projectShow(projectId)}>{t('Back to project')}</Link>
            </Button>
            <Button size="sm" onClick={() => openCreate(columns[0]?.id ?? '')}>
              <Plus className="mr-1 h-4 w-4" />
              {kind === 'tasks' ? t('Add task') : t('Add bug')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => openCreate(columns[0]?.id ?? '')}>
            <Plus className="mr-1 h-4 w-4" />
            {kind === 'tasks' ? t('Add task') : t('Add bug')}
          </Button>
        </div>
      )}

      <KanbanBoard
        columns={columns}
        tasks={(data?.tasks ?? {}) as Record<string, KanbanTask[]>}
        onMove={handleMove}
        kanbanActions={(columnId) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => openCreate(columnId)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        taskCard={({ task, columnId }) => (
          <DraggableKanbanCard task={task} columnId={columnId} />
        )}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{kind === 'tasks' ? t('New task') : t('New bug')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!title.trim()) return
              const stageId = stageIdByKey.get(createStageKey)
              createMutation.mutate({ title: title.trim(), stage_id: stageId })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DraggableKanbanCard({ task, columnId }: { task: KanbanTask; columnId: string }) {
  const assigned = (task.assigned_users as Array<{ name: string }> | undefined) ?? []
  const milestone = task.milestone as string | undefined

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ taskId: task.id, fromColumn: columnId }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="mb-2 cursor-grab rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <p className="font-medium">{task.title}</p>
      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{String(task.description)}</p>
      ) : null}
      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {task.priority ? <p className="capitalize">{String(task.priority)}</p> : null}
        {milestone ? <p>{milestone}</p> : null}
        {assigned.length > 0 ? <p>{assigned.map((u) => u.name).join(', ')}</p> : null}
        {task.due_date ? <p>{String(task.due_date)}</p> : null}
      </div>
    </div>
  )
}
