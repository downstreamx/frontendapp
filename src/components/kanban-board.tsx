import { forwardRef, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type KanbanTask = {
  id: number
  title: string
  description?: string
  priority?: string
  [key: string]: unknown
}

export type KanbanColumn = {
  id: string
  title: string
  color: string
}

export type KanbanBoardProps = {
  tasks: Record<string, KanbanTask[]>
  columns: KanbanColumn[]
  onMove?: (taskId: number, fromStatus: string, toStatus: string) => void
  kanbanActions?: ReactNode | ((columnId: string) => ReactNode)
  taskCard?: ComponentType<{ task: KanbanTask; columnId: string }>
}

function KanbanColumnComponent({
  column,
  tasks,
  onMove,
  kanbanActions,
  TaskCard,
}: {
  column: KanbanColumn
  tasks: KanbanTask[]
  onMove?: (taskId: number, fromStatus: string, toStatus: string) => void
  kanbanActions?: ReactNode | ((columnId: string) => ReactNode)
  TaskCard?: ComponentType<{ task: KanbanTask; columnId: string }>
}) {
  const { t } = useTranslation()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json')) as {
        taskId?: number
        fromColumn?: string
      }
      if (data.taskId && onMove) {
        onMove(data.taskId, data.fromColumn ?? '', column.id)
      }
    } catch {
      // ignore malformed drag payload
    }
  }

  return (
    <div
      className="min-w-72 max-w-80 flex-1"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`h-full rounded-lg transition-all ${isDragOver ? 'bg-primary/5 ring-2 ring-primary' : ''}`}
        style={{ backgroundColor: `${column.color}10` }}
      >
        <div
          className="rounded-t-lg border-b border-white/50 px-3 py-2"
          style={{ backgroundColor: `${column.color}20` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold" style={{ color: column.color }}>
                {column.title}
              </h3>
              <span
                className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium"
                style={{ color: column.color }}
              >
                {tasks.length}
              </span>
            </div>
            {typeof kanbanActions === 'function' ? kanbanActions(column.id) : kanbanActions}
          </div>
        </div>
        <div className="max-h-[calc(100vh-220px)] min-h-[420px] overflow-y-auto p-2">
          {tasks.map((task) =>
            TaskCard ? (
              <TaskCard key={task.id} task={task} columnId={column.id} />
            ) : (
              <DefaultKanbanCard key={task.id} task={task} columnId={column.id} />
            ),
          )}
          {tasks.length === 0 && (
            <p className="py-12 text-center text-xs text-muted-foreground">{t('Drop items here')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function DefaultKanbanCard({ task, columnId }: { task: KanbanTask; columnId: string }) {
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
    </div>
  )
}

const KanbanBoard = forwardRef<HTMLDivElement, KanbanBoardProps>(function KanbanBoard(
  { tasks: initialTasks, columns, onMove, kanbanActions, taskCard: TaskCard },
  ref,
) {
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const handleMove = (taskId: number, fromStatus: string, toStatus: string) => {
    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks }
      let movedTask: KanbanTask | null = null

      Object.keys(newTasks).forEach((status) => {
        const taskIndex = newTasks[status].findIndex((task) => task.id === taskId)
        if (taskIndex !== -1) {
          movedTask = newTasks[status][taskIndex]
          newTasks[status] = newTasks[status].filter((task) => task.id !== taskId)
        }
      })

      if (movedTask) {
        newTasks[toStatus] = [...(newTasks[toStatus] || []), movedTask]
      }

      return newTasks
    })

    onMove?.(taskId, fromStatus, toStatus)
  }

  return (
    <div ref={ref} className="flex space-x-4 overflow-x-auto pb-6">
      {columns.map((column) => (
        <KanbanColumnComponent
          key={column.id}
          column={column}
          tasks={tasks[column.id] || []}
          onMove={handleMove}
          kanbanActions={kanbanActions}
          TaskCard={TaskCard}
        />
      ))}
    </div>
  )
})

export default KanbanBoard
