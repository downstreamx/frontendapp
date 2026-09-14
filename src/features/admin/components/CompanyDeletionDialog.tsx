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
import { ProvisionProgressPanel } from '@/features/shared/components/ProvisionProgressPanel'
import { useAdminCompanyDeletion } from '@/features/admin/hooks/use-admin-company-deletion'

type Props = {
  open: boolean
  companyId: number | null
  companyName?: string | null
  onClose: () => void
}

export function CompanyDeletionDialog({ open, companyId, companyName, onClose }: Props) {
  const { t } = useTranslation()
  const { status, error, currentLabel, done, retry } = useAdminCompanyDeletion(
    companyId,
    open && companyId != null,
  )

  const running = open && !done && !error
  const canDismiss = done || Boolean(error)
  const name = status?.company?.name ?? companyName ?? t('The company')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && canDismiss) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="sm:max-w-xl"
        hideCloseButton={running}
        onPointerDownOutside={(e) => {
          if (running) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (running) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (running) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('Removing company')}</DialogTitle>
          <DialogDescription>
            {t('Deleting data for {{name}}', { name })}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-5 pt-1">
            <p className="text-base leading-relaxed text-foreground">
              {t('{{name}} and all related records have been permanently removed.', { name })}
            </p>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                {t('Done')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="pt-1">
            <ProvisionProgressPanel
              status={status}
              currentLabel={currentLabel}
              subtitle={t('Removing modules and records for this company workspace')}
              error={error}
              onRetry={error ? retry : undefined}
              footer={
                error ? (
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {t('Close')}
                    </Button>
                  </DialogFooter>
                ) : null
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
