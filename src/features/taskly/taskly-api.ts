import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type ProjectTeamMember = {
  id: number
  name: string
  avatar?: string | null
}

export type ProjectListRow = {
  id: number
  name: string
  description?: string | null
  budget?: number | string | null
  start_date?: string | null
  end_date?: string | null
  status: string
  team_members: ProjectTeamMember[]
  task_count: number
}

export type ProjectDuplicateOptions = {
  all?: boolean
  tasks?: boolean
  taskSubtasks?: boolean
  taskComments?: boolean
  bugs?: boolean
  bugComments?: boolean
  activity?: boolean
  teamMembers?: boolean
  clients?: boolean
  milestones?: boolean
  projectFiles?: boolean
}

export const PROJECT_STATUSES = ['Ongoing', 'Onhold', 'Finished'] as const

export async function listProjectsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<ProjectListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/taskly/projects', { params })
  return extractPaginatedList<ProjectListRow>(data)
}

export type ProjectCreateMeta = {
  users: Array<{ id: number; name: string; avatar?: string | null }>
  milestone_statuses: string[]
}

export type ProjectMilestoneInput = {
  title: string
  cost?: number | null
  start_date?: string | null
  end_date?: string | null
  summary?: string | null
  status?: string
  progress?: number
}

export type ProjectCreatePayload = {
  name: string
  user_ids: number[]
  description?: string
  budget: number
  start_date: string
  end_date: string
  milestones?: ProjectMilestoneInput[]
}

export async function fetchProjectCreateMeta() {
  const { data } = await api.get<ApiSuccess<ProjectCreateMeta>>('/taskly/projects/create-meta')
  return data.data
}

export async function createProject(payload: ProjectCreatePayload) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>('/taskly/projects', payload)
  return data.data
}

export type ProjectEditMeta = {
  project: {
    id: number
    name: string
    description?: string | null
    budget?: number | string | null
    start_date?: string | null
    end_date?: string | null
    status: string
  }
  statuses: string[]
}

export type ProjectUpdatePayload = {
  name: string
  description?: string
  budget: number
  start_date: string
  end_date: string
  status?: string
}

export async function fetchProjectEditMeta(id: number | string) {
  const { data } = await api.get<ApiSuccess<ProjectEditMeta>>(`/taskly/projects/${id}/edit-meta`)
  return data.data
}

export async function updateProject(id: number | string, payload: ProjectUpdatePayload) {
  const { data } = await api.put<ApiSuccess<{ id: number }>>(`/taskly/projects/${id}`, payload)
  return data.data
}

export async function updateProjectStatus(id: number, status: string) {
  const { data } = await api.put<ApiSuccess<{ id: number }>>(`/taskly/projects/${id}`, { status })
  return data.data
}

export async function deleteProject(id: number) {
  await api.delete(`/taskly/projects/${id}`)
}

export async function duplicateProject(id: number, options: ProjectDuplicateOptions) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>(`/taskly/projects/${id}/duplicate`, options)
  return data.data
}

export type ProjectReportListRow = {
  id: number
  name: string
  start_date?: string | null
  end_date?: string | null
  status: string
  tasks_count: string
  bugs_count: string
  milestones_count: string
}

export async function listProjectReportsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<ProjectReportListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/taskly/projects/reports', { params })
  return extractPaginatedList<ProjectReportListRow>(data)
}

export type ProjectReportShowPayload = {
  project: {
    id: number
    name: string
    description?: string | null
    start_date?: string | null
    end_date?: string | null
    status: string
    budget?: number | string | null
  }
  task_status_data: Array<{ name: string; value: number; color?: string }>
  task_priority_data: Array<{ name: string; value: number }>
  project_stats: {
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    team_members: number
  }
  users_data: Array<{
    id: number
    name: string
    assigned_tasks: number
    done_tasks: number
  }>
  milestones_data: Array<{
    id: number
    name: string
    progress: number
    cost: number | string
    status: string
    start_date?: string | null
    end_date?: string | null
  }>
}

export async function fetchProjectReport(id: number | string) {
  const { data } = await api.get<ApiSuccess<ProjectReportShowPayload>>(`/taskly/projects/reports/${id}`)
  return data.data
}

/** @deprecated Use listProjectsPaginated */
export async function listProjects() {
  const result = await listProjectsPaginated()
  return result.rows
}
