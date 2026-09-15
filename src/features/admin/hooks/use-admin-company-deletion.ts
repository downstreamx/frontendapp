import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import {
  fetchAdminDeletionStatus,
  runAdminDeletionStep,
  type AdminDeletionStatus,
} from '@/features/admin/admin-deletion-api'
import { getApiErrorMessage } from '@/lib/errors'

const MIN_STEP_MS = 2500

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isGone(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

function completedStatusFrom(companyId: number): AdminDeletionStatus {
  return {
    steps: [],
    completed: [],
    next_step: null,
    percent: 100,
    done: true,
    deletion_started_at: null,
    company: { id: companyId, name: '' },
  }
}

export function useAdminCompanyDeletion(companyId: number | null, enabled: boolean) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<AdminDeletionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLabel, setCurrentLabel] = useState(t('Preparing to remove company data…'))
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
    setCurrentLabel(t('Preparing to remove company data…'))

    const run = async () => {
      try {
        let progress: AdminDeletionStatus
        try {
          progress = await fetchAdminDeletionStatus(companyId)
        } catch (err) {
          if (isGone(err)) {
            progress = completedStatusFrom(companyId)
          } else {
            throw err
          }
        }
        if (cancelled) return
        setStatus(progress)

        while (!progress.done) {
          const next = progress.next_step
          if (!next) {
            break
          }
          const stepMeta = progress.steps.find((step) => step.id === next)
          setCurrentLabel(stepMeta?.label ?? t('Removing…'))
          const started = Date.now()
          let result: AdminDeletionStatus
          try {
            result = await runAdminDeletionStep(companyId, next)
          } catch (err) {
            if (isGone(err)) {
              result = completedStatusFrom(companyId)
            } else {
              throw err
            }
          }
          if (cancelled) return
          const remaining = MIN_STEP_MS - (Date.now() - started)
          if (remaining > 0) {
            await sleep(remaining)
            if (cancelled) return
          }
          progress = result
          setStatus(progress)
        }

        setCurrentLabel(t('Company removed'))
        setDone(true)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('Company deletion failed. You can retry.')))
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
