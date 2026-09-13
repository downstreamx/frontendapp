import { useEffect } from 'react'
import { toast } from 'sonner'

/** SPA replacement for Inertia flash → sonner */
export function useFlashMessages(flash?: { success?: string; error?: string }) {
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
  }, [flash?.success, flash?.error])
}
