import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProvisionStatus } from '@/features/admin/admin-provision-api'
import { cn } from '@/lib/utils'

type ProgressStatus = Pick<ProvisionStatus, 'steps' | 'percent' | 'done' | 'next_step' | 'completed'>

type Props = {
  status: ProgressStatus | null
  currentLabel: string
  subtitle?: string
  error?: string | null
  onRetry?: () => void
  footer?: React.ReactNode
}

export function ProvisionProgressPanel({
  status,
  currentLabel,
  subtitle,
  error,
  onRetry,
  footer,
}: Props) {
  const { t } = useTranslation()
  const percent = status?.percent ?? 0
  const activeStepId = status?.done ? null : status?.next_step ?? null
  const helperText = subtitle ?? t('Setting up modules for this company workspace')

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-lg font-semibold leading-snug tracking-tight text-foreground">
              {currentLabel}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{helperText}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--brand-green-soft)] px-2.5 py-1 text-sm font-semibold tabular-nums text-accent-foreground">
            {percent}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--section-deep))]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {status ? (
        <ul className="space-y-2.5">
          {status.steps.map((step) => {
            const isActive = !step.completed && step.id === activeStepId
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-base leading-relaxed transition-colors',
                  step.completed &&
                    'border-primary/15 bg-[var(--brand-green-soft)] text-foreground',
                  isActive && 'border-primary/35 bg-accent text-foreground',
                  !step.completed &&
                    !isActive &&
                    'border-border/40 bg-[hsl(var(--section-deep))]/50 text-muted-foreground',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {step.completed ? (
                    <CheckCircle2
                      className="h-7 w-7 text-primary animate-in zoom-in-50 fade-in-0 duration-300"
                      aria-hidden
                    />
                  ) : isActive ? (
                    <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
                  ) : (
                    <span
                      className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/35"
                      aria-hidden
                    />
                  )}
                </span>
                <span className={cn('font-medium', isActive && 'text-foreground')}>{step.label}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
        </div>
      )}

      {error ? (
        <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t('Retry')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {footer}
    </div>
  )
}
