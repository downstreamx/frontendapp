import { useState } from 'react'
import { api } from '@/lib/api'
import { route } from '@/lib/route'

interface UseDeleteHandlerOptions {
  routeName: string
  defaultMessage?: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export const useDeleteHandler = ({
  routeName,
  defaultMessage = 'Are you sure you want to delete this item?',
  onSuccess,
  onError,
}: UseDeleteHandlerOptions) => {
  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean
    id: number | string | null
    message: string
  }>({
    isOpen: false,
    id: null,
    message: defaultMessage,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const openDeleteDialog = (id: number | string, message?: string) => {
    setDeleteState({ isOpen: true, id, message: message || defaultMessage })
  }

  const closeDeleteDialog = () => {
    setDeleteState({ isOpen: false, id: null, message: defaultMessage })
  }

  const confirmDelete = async () => {
    if (deleteState.id === null || deleteState.id === undefined) return
    setIsDeleting(true)
    try {
      const url = route(routeName, { id: deleteState.id })
      await api.delete(url.replace(/^\//, ''))
      closeDeleteDialog()
      onSuccess?.()
    } catch (e) {
      onError?.(e)
      throw e
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting }
}
