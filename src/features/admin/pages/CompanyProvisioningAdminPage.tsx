import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { ProvisionProgressPanel } from '@/features/shared/components/ProvisionProgressPanel'
import {
  fetchAdminProvisionStatus,
  runAdminProvisionStep,
  type AdminProvisionStatus,
} from '@/features/admin/admin-provision-api'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'

export function CompanyProvisioningAdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const companyIdRaw = searchParams.get('company_id')
  const companyId = companyIdRaw ? Number(companyIdRaw) : null
  const [status, setStatus] = useState<AdminProvisionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLabel, setCurrentLabel] = useState(t('Preparing company workspace…'))
  const [done, setDone] = useState(false)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    if (!companyId || Number.isNaN(companyId)) {
      setError(t('Missing company id. Open provisioning from the companies list.'))
      return
    }

    let cancelled = false
    setError(null)
    setDone(false)
    setStatus(null)
    setCurrentLabel(t('Preparing company workspace…'))

    const run = async () => {
      try {
        let progress = await fetchAdminProvisionStatus(companyId)
        if (cancelled) return
        setStatus(progress)

        while (!progress.done) {
          const next = progress.next_step
          const stepMeta = progress.steps.find((step) => step.id === next)
          setCurrentLabel(stepMeta?.label ?? t('Setting up…'))
          progress = await runAdminProvisionStep(companyId, next ?? undefined)
          if (cancelled) return
          setStatus(progress)
        }

        setCurrentLabel(t('Provisioning complete'))
        setDone(true)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('Provisioning failed. You can retry.')))
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [companyId, runKey, t])

  if (!companyId || Number.isNaN(companyId)) {
    return (
      <ModuleListCard title={t('Company setup')}>
        <p className="text-sm text-destructive p-4">
          {error ?? t('Missing company id.')}
        </p>
        <div className="px-4 pb-4">
          <Button type="button" variant="outline" asChild>
            <Link to={paths.users.index}>{t('Back to companies')}</Link>
          </Button>
        </div>
      </ModuleListCard>
    )
  }

  return (
    <ModuleListCard
      title={t('Company setup')}
      description={
        status?.company?.name
          ? t('Provisioning {{name}}', { name: status.company.name })
          : t('Activating modules, roles, and oil & gas defaults.')
      }
    >
      <div className="max-w-xl p-4">
        {done && status ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {t('{{name}} is ready. Share these login details with the company owner:', {
                name: status.company?.name ?? t('The company'),
              })}
            </p>
            <div className="space-y-1 rounded-md border bg-muted/40 px-4 py-3 text-sm">
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
            <Button type="button" onClick={() => navigate(paths.users.index)}>
              {t('Back to companies')}
            </Button>
          </div>
        ) : (
          <ProvisionProgressPanel
            status={status}
            currentLabel={currentLabel}
            error={error}
            onRetry={() => setRunKey((k) => k + 1)}
          />
        )}
      </div>
    </ModuleListCard>
  )
}
