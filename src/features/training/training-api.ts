import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type TrainingRow = {
  id: number
  title: string
  description?: string
  training_type_id?: number
  trainer_id?: number
  start_date?: string
  end_date?: string
  location?: string
  status?: string
  training_type?: { id: number; name: string } | null
  trainer?: { id: number; name: string } | null
}

export type TrainerRow = {
  id: number
  name: string
  contact?: string
  email?: string
  experience?: string
  expertise?: string
  trainings_count?: number
}

export type TrainingsIndexMeta = {
  statuses: string[]
  training_types: Array<{ id: number; name: string }>
  trainers: Array<{ id: number; name: string; email?: string }>
}

export type TrainingCreateMeta = {
  training_types: Array<{ id: number; name: string }>
  trainers: Array<{ id: number; name: string; email?: string }>
}

export async function fetchTrainingMeta(): Promise<TrainingCreateMeta> {
  const { data } = await api.get<ApiSuccess<TrainingCreateMeta>>('/training/create-meta')
  return data.data
}

export async function fetchTrainingsIndexMeta(): Promise<TrainingsIndexMeta> {
  const { data } = await api.get<ApiSuccess<TrainingsIndexMeta>>('/training/trainings/index-meta')
  return data.data
}

export async function listTrainingsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TrainingRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/training/trainings', { params })
  return extractPaginatedList<TrainingRow>(data)
}

export async function createTraining(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TrainingRow>>('/training/trainings', payload)
  return data.data
}

export async function updateTraining(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TrainingRow>>(`/training/trainings/${id}`, payload)
  return data.data
}

export async function getTraining(id: number) {
  const { data } = await api.get<ApiSuccess<TrainingRow>>(`/training/trainings/${id}`)
  return data.data
}

export async function deleteTraining(id: number) {
  await api.delete(`/training/trainings/${id}`)
}

export async function getTrainer(id: number) {
  const { data } = await api.get<ApiSuccess<TrainerRow>>(`/training/trainers/${id}`)
  return data.data
}

export async function listTrainersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TrainerRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/training/trainers', { params })
  return extractPaginatedList<TrainerRow>(data)
}

export async function createTrainer(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TrainerRow>>('/training/trainers', payload)
  return data.data
}

export async function updateTrainer(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TrainerRow>>(`/training/trainers/${id}`, payload)
  return data.data
}

export async function deleteTrainer(id: number) {
  await api.delete(`/training/trainers/${id}`)
}
