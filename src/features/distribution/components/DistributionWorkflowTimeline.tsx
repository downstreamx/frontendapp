import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/helpers'
import {
  distributionWorkflowSteps,
  workflowStepIndex,
  type WorkflowStep,
} from '../distribution-workflow'
import type { DistributionRow } from '../distribution-api'

type Props = {
  apiPath: string
  record: DistributionRow
}

function connectorClass(done: boolean): string {
  return done ? 'border-green-600' : 'border-muted-foreground/30'
}

export function DistributionWorkflowTimeline({ apiPath, record }: Props) {
  const { t } = useTranslation()
  const steps = distributionWorkflowSteps[apiPath]
  if (!steps?.length) return null

  const status = String(record.status ?? '')
  const activeIndex = workflowStepIndex(apiPath, status)

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <h3 className="mb-4 text-sm font-semibold">{t('Workflow')}</h3>
      <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
        {steps.map((step: WorkflowStep, index: number) => {
          const done = index < activeIndex
          const current = index === activeIndex
          const dateValue = step.dateField ? record[step.dateField] : null
          const segmentComplete = index < activeIndex

          return (
            <li
              key={step.key}
              className="flex flex-1 flex-col items-start sm:items-center sm:text-center"
            >
              <div className="flex w-full items-center sm:flex-col sm:gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    done
                      ? 'border-green-600 bg-green-600 text-white'
                      : current
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`mx-2 hidden flex-1 self-center border-t-2 border-dotted sm:block ${connectorClass(segmentComplete)}`}
                    aria-hidden
                  />
                ) : null}
                <div className="min-w-0 flex-1 py-2 sm:py-0 sm:text-center">
                  <p className={`text-sm font-medium ${current ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(step.labelKey)}
                  </p>
                  {dateValue ? (
                    <p className="text-xs text-muted-foreground">{formatDate(String(dateValue))}</p>
                  ) : null}
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={`ml-4 h-6 w-0 border-l-2 border-dotted sm:hidden ${connectorClass(segmentComplete)}`}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
