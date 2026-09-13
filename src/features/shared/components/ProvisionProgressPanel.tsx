import { useTranslation } from 'react-i18next'
import type { ProvisionStatus } from '@/features/admin/admin-provision-api'

type Props = {
  status: ProvisionStatus | null
  currentLabel: string
  error?: string | null
  onRetry?: () => void
  footer?: React.ReactNode
}

export function ProvisionProgressPanel({
  status,
  currentLabel,
  error,
  onRetry,
  footer,
}: Props) {
  const { t } = useTranslation()
  const percent = status?.percent ?? 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{currentLabel}</span>
          <span className="font-medium tabular-nums">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {status ? (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {status.steps.map((step) => (
            <li key={step.id} className={step.completed ? 'text-foreground' : undefined}>
              {step.completed ? '✓' : '○'} {step.label}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          {onRetry ? (
            <button
              type="button"
              className="text-sm font-medium text-primary underline"
              onClick={onRetry}
            >
              {t('Retry')}
            </button>
          ) : null}
        </div>
      ) : null}

      {footer}
    </div>
  )
}
