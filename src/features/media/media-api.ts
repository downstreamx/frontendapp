import axios from 'axios'
import { api, type ApiSuccess } from '@/lib/api'

export type MediaItem = {
  id: number
  name: string
  file_name: string
  url: string
  thumb_url: string
  size: number
  mime_type: string
  directory_id?: number | null
  created_at: string
}

export type MediaDirectory = {
  id: number
  name: string
  slug: string
}

export type MediaLibraryPayload = {
  media: MediaItem[]
  directories: MediaDirectory[]
}

export async function fetchMediaLibrary(directoryId?: number | null): Promise<MediaLibraryPayload> {
  const params: Record<string, string> = {}
  if (directoryId) {
    params.directory_id = String(directoryId)
  }
  const { data } = await api.get<ApiSuccess<MediaLibraryPayload>>('/media', { params })
  return data.data ?? { media: [], directories: [] }
}

export type MediaUploadResult = {
  message?: string
  data?: MediaItem[]
  errors?: string[]
}

export async function uploadMediaFiles(files: File[], directoryId?: number | null): Promise<MediaUploadResult> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files[]', file))
  if (directoryId) {
    formData.append('directory_id', String(directoryId))
  }
  try {
    const { data } = await api.post<ApiSuccess<MediaUploadResult>>('/media/batch', formData)
    return data.data ?? {}
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as {
        message?: string
        errors?: Record<string, string[]> | string[]
      }
      const fieldErrors = payload?.errors
      if (fieldErrors && !Array.isArray(fieldErrors)) {
        const messages = Object.values(fieldErrors).flat()
        if (messages.length > 0) {
          throw new Error(messages.join(' '))
        }
      }
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        throw new Error(fieldErrors.join(' '))
      }
      if (payload?.message) {
        throw new Error(payload.message)
      }
    }
    throw error
  }
}

export async function createMediaDirectory(name: string): Promise<MediaDirectory> {
  const { data } = await api.post<ApiSuccess<MediaDirectory>>('/media/directories', { name })
  return data.data!
}

export async function deleteMedia(id: number): Promise<void> {
  await api.delete(`/media/${id}`)
}

export async function updateMediaDirectory(id: number, name: string): Promise<MediaDirectory> {
  const { data } = await api.put<ApiSuccess<MediaDirectory>>(`/media/directories/${id}`, { name })
  return data.data!
}

export async function deleteMediaDirectory(id: number): Promise<void> {
  await api.delete(`/media/directories/${id}`)
}

export async function moveMediaToDirectory(mediaId: number, directoryId: number | null): Promise<void> {
  await api.patch(`/media/${mediaId}/directory`, {
    directory_id: directoryId,
  })
}

export async function downloadMediaFile(id: number, filename: string): Promise<void> {
  const { data } = await api.get<Blob>(`/media/${id}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
