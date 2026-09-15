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
import { useAdminCompanyProvision } from '@/features/admin/hooks/use-admin-company-provision'

type Props = {
  open: boolean
  companyId: number | null
  onClose: () => void
}

export function CompanyProvisioningDialog({ open, companyId, onClose }: Props) {
  const { t } = useTranslation()
  const { status, error, currentLabel, done, retry } = useAdminCompanyProvision(
    companyId,
    open && companyId != null,
  )

  const running = open && !done && !error
  const canDismiss = done || Boolean(error)

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
          <DialogTitle>{t('Company setup')}</DialogTitle>
          <DialogDescription>
            {status?.company?.name
              ? t('Provisioning {{name}}', { name: status.company.name })
              : t('Turning on modules, roles, and workspace defaults.')}
          </DialogDescription>
        </DialogHeader>

        {done && status ? (
          <div className="space-y-5 pt-1">
            <p className="text-base leading-relaxed text-foreground">
              {t('{{name}} is ready. Share these login details with the company owner:', {
                name: status.company?.name ?? t('The company'),
              })}
            </p>
            <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--section-deep))]/80 px-4 py-4 text-sm">
              <p>
                <span className="text-muted-foreground">{t('Owner')}: </span>
                {status.owner?.name}
              </p>
              <p>
                <span className="text-muted-foreground">{t('Email')}: </span>
                {status.owner?.email}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Use the password you set when creating the company account.')}
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
