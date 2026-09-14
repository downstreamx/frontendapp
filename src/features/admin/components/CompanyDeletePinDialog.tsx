import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pin: string) => void | Promise<void>
  loading?: boolean
}

export function CompanyDeletePinDialog({ open, onOpenChange, onConfirm, loading }: Props) {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setPin('')
    setError(null)
  }

  const handleConfirm = async () => {
    if (!pin.trim()) {
      setError(t('Enter the confirmation PIN.'))
      return
    }
    setError(null)
    try {
      await onConfirm(pin.trim())
      reset()
    } catch {
      // Keep PIN so the admin can correct a wrong value / retry after API errors.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md" hideCloseButton={loading}>
        <DialogHeader>
          <DialogTitle>{t('Confirm with PIN')}</DialogTitle>
          <DialogDescription>
            {t(
              'Enter the security PIN to permanently delete this company and all of its data. This cannot be undone.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-1">
          <Label htmlFor="company-delete-pin">{t('Confirmation PIN')}</Label>
          <PasswordInput
            id="company-delete-pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t('Enter PIN')}
            autoComplete="off"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleConfirm()
              }
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? t('Deleting...') : t('Delete company')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
