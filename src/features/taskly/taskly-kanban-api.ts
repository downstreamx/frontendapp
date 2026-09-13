import { api, type ApiSuccess } from '@/lib/api'

export type KanbanStage = {
  id: number
  name: string
  color: string
  key: string
  order?: number
}

export type ProjectKanbanResponse = {
  project: { id: number; name: string }
  stages: KanbanStage[]
  tasks: Record<string, Array<Record<string, unknown>>>
}

export async function fetchProjectTasksKanban(projectId: string | number) {
  const { data } = await api.get<ApiSuccess<ProjectKanbanResponse>>(
    `/taskly/projects/${projectId}/tasks/kanban`,
  )
  return data.data
}

export async function fetchProjectBugsKanban(projectId: string | number) {
  const { data } = await api.get<ApiSuccess<ProjectKanbanResponse>>(
    `/taskly/projects/${projectId}/bugs/kanban`,
  )
  return data.data
}

export async function moveProjectTask(projectId: string | number, taskId: number, stageId: number) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/taskly/projects/${projectId}/tasks/${taskId}/move`,
    { stage_id: stageId },
  )
  return data.data
}

export async function moveProjectBug(projectId: string | number, bugId: number, stageId: number) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/taskly/projects/${projectId}/bugs/${bugId}/move`,
    { stage_id: stageId },
  )
  return data.data
}

export async function createProjectTask(
  projectId: string | number,
  payload: { title: string; description?: string; stage_id?: number; priority?: string },
) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/taskly/projects/${projectId}/tasks`, payload)
  return data.data
}

export async function createProjectBug(
  projectId: string | number,
  payload: { title: string; description?: string; stage_id?: number; priority?: string },
) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/taskly/projects/${projectId}/bugs`, payload)
  return data.data
}
