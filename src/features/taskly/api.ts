import { api, type ApiSuccess } from '@/lib/api'

export type ProjectMilestone = {
  id: number
  title: string
  cost?: number
  start_date?: string
  end_date?: string
  summary?: string
  status?: string
  progress?: number
}

export type ProjectRecord = {
  id: number
  name: string
  description?: string
  budget?: number | string
  start_date?: string
  end_date?: string
  status?: string
  team_members?: Array<{ id: number; name: string; email?: string }>
  teamMembers?: ProjectRecord['team_members']
  clients?: Array<{ id: number; name: string; email?: string }>
  milestones?: ProjectMilestone[]
  tasks?: Array<Record<string, unknown>>
  bugs?: Array<Record<string, unknown>>
  files?: Array<{ id: number; file_name?: string; file_path?: string }>
  activity_logs?: Array<{
    id: number
    log_type?: string
    remark?: string
    created_at?: string
    user?: { id: number; name: string }
  }>
  activityLogs?: ProjectRecord['activity_logs']
}

export type ChartLine = { dataKey: string; color: string; name: string }
export type ChartPoint = { name: string; [key: string]: string | number }

export type ProjectMemberOption = { id: number; name: string }

export type ProjectShowResponse = {
  project: ProjectRecord
  project_stats: {
    taskCount: number
    bugCount: number
    daysLeft: number
    budget?: number | string
  }
  chart_data?: ChartPoint[]
  chart_lines?: ChartLine[]
  available_team_members?: ProjectMemberOption[]
  available_clients?: ProjectMemberOption[]
}

export async function getProject(id: string | number) {
  const { data } = await api.get<ApiSuccess<ProjectShowResponse>>(`/taskly/projects/${id}`)
  return data.data
}

export async function createMilestone(projectId: string | number, body: Partial<ProjectMilestone>) {
  const { data } = await api.post<ApiSuccess<ProjectMilestone>>(
    `/taskly/projects/${projectId}/milestones`,
    body,
  )
  return data.data
}

export async function updateMilestone(
  projectId: string | number,
  milestoneId: number,
  body: Partial<ProjectMilestone>,
) {
  const { data } = await api.put<ApiSuccess<ProjectMilestone>>(
    `/taskly/projects/${projectId}/milestones/${milestoneId}`,
    body,
  )
  return data.data
}

export async function deleteMilestone(projectId: string | number, milestoneId: number) {
  await api.delete(`/taskly/projects/${projectId}/milestones/${milestoneId}`)
}

export async function addTeamMembers(projectId: string | number, userIds: number[]) {
  const { data } = await api.post<ApiSuccess<ProjectRecord>>(
    `/taskly/projects/${projectId}/team-members`,
    { user_ids: userIds },
  )
  return data.data
}

export async function removeTeamMember(projectId: string | number, userId: number) {
  await api.delete(`/taskly/projects/${projectId}/team-members/${userId}`)
}

export async function addClients(projectId: string | number, clientIds: number[]) {
  const { data } = await api.post<ApiSuccess<ProjectRecord>>(
    `/taskly/projects/${projectId}/clients`,
    { client_ids: clientIds },
  )
  return data.data
}

export async function removeClient(projectId: string | number, clientId: number) {
  await api.delete(`/taskly/projects/${projectId}/clients/${clientId}`)
}

export async function uploadProjectFile(
  projectId: string | number,
  file: { file_name: string; file_path: string },
) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>(
    `/taskly/projects/${projectId}/files`,
    file,
  )
  return data.data
}

export async function deleteProjectFile(projectId: string | number, fileId: number) {
  await api.delete(`/taskly/projects/${projectId}/files/${fileId}`)
}
