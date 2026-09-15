import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import KanbanBoard, { type KanbanColumn, type KanbanTask } from '@/components/kanban-board'
import { getApiErrorMessage } from '@/lib/errors'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  fetchDealsKanban,
  fetchLeadsKanban,
  moveDealStage,
  moveLeadStage,
  type CrmKanbanResponse,
} from '../lead-api'

type Props = {
  kind: 'leads' | 'deals'
  pipelineId?: number
  showPath: (id: number) => string
}

function DraggableCrmCard({
  task,
  columnId,
  showPath,
}: {
  task: KanbanTask
  columnId: string
  showPath: (id: number) => string
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ taskId: task.id, fromColumn: columnId }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  const email = task.email as string | undefined
  const phone = task.phone as string | undefined
  const price = task.price as number | string | undefined

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="mb-2 cursor-grab rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <Link to={showPath(task.id)} className="font-medium text-primary hover:underline">
        {task.title}
      </Link>
      {email ? <p className="mt-1 text-xs text-muted-foreground">{email}</p> : null}
      {phone ? <p className="text-xs text-muted-foreground">{phone}</p> : null}
      {price != null ? <p className="mt-1 text-xs font-medium">{String(price)}</p> : null}
    </div>
  )
}

export function CrmKanbanView({ kind, pipelineId, showPath }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = [kind, 'kanban', pipelineId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => (kind === 'leads' ? fetchLeadsKanban(pipelineId) : fetchDealsKanban(pipelineId)),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: number; stageId: number }) =>
      kind === 'leads' ? moveLeadStage(id, stageId) : moveDealStage(id, stageId),
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to move card'))),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: ['lead', kind] })
    },
  })

  if (isLoading) {
    return <PageContentLoader label={t('Loading board…')} className="min-h-[16rem]" />
  }

  const board = data as CrmKanbanResponse | undefined
  const columns: KanbanColumn[] = (board?.stages ?? []).map((stage) => ({
    id: stage.key,
    title: stage.name,
    color: stage.color,
  }))

  const stageIdByKey = new Map((board?.stages ?? []).map((s) => [s.key, s.id]))

  const handleMove = (taskId: number, _from: string, toColumn: string) => {
    const stageId = stageIdByKey.get(toColumn)
    if (!stageId) return
    moveMutation.mutate({ id: taskId, stageId })
  }

  if (!board?.stages?.length) {
    return <p className="text-sm text-muted-foreground">{t('No pipeline stages configured.')}</p>
  }

  return (
    <KanbanBoard
      columns={columns}
      tasks={(board.tasks ?? {}) as Record<string, KanbanTask[]>}
      onMove={handleMove}
      taskCard={({ task, columnId }) => (
        <DraggableCrmCard task={task} columnId={columnId} showPath={showPath} />
      )}
    />
  )
}
