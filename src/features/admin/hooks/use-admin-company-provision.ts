import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchAdminProvisionStatus,
  runAdminProvisionStep,
  type AdminProvisionStatus,
} from '@/features/admin/admin-provision-api'
import { getApiErrorMessage } from '@/lib/errors'

const MIN_STEP_MS = 2500

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function useAdminCompanyProvision(companyId: number | null, enabled: boolean) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<AdminProvisionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLabel, setCurrentLabel] = useState(t('Preparing company workspace…'))
  const [done, setDone] = useState(false)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    if (!enabled || companyId == null || Number.isNaN(companyId)) {
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
          if (!next) {
            break
          }
          const stepMeta = progress.steps.find((step) => step.id === next)
          setCurrentLabel(stepMeta?.label ?? t('Setting up…'))
          const started = Date.now()
          const result = await runAdminProvisionStep(companyId, next)
          if (cancelled) return
          // Keep the active-step spinner visible for the full dwell window.
          const remaining = MIN_STEP_MS - (Date.now() - started)
          if (remaining > 0) {
            await sleep(remaining)
            if (cancelled) return
          }
          progress = result
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
  }, [companyId, enabled, runKey, t])

  return {
    status,
    error,
    currentLabel,
    done,
    retry: () => setRunKey((k) => k + 1),
  }
}
