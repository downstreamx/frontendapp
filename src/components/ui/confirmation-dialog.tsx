import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message?: string
  /** Legacy alias for `message`. */
  description?: string
  confirmText?: string
  cancelText?: string
  /** May return void; boolean short-circuit from legacy `&& mutate()` handlers is ignored. */
  onConfirm: () => void | Promise<void> | boolean | null | undefined
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'default',
  loading: loadingProp,
}: ConfirmationDialogProps) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const loading = loadingProp ?? pending

  const handleConfirm = async () => {
    try {
      setPending(true)
      await Promise.resolve(onConfirm())
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || t('Confirm Action')}</AlertDialogTitle>
          <AlertDialogDescription>
            {message ?? description ?? t('Are you sure you want to proceed?')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText || t('Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              void handleConfirm()
            }}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {loading ? t('Loading…') : confirmText || t('Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
