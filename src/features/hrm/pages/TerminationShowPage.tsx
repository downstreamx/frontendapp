import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getTermination } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export function TerminationShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'terminations',
    listPath: '/hrm/terminations',
    listLabel: t('Terminations'),
    pageTitle: t('Termination'),
    queryFn: getTermination,
    getEmployeeName: (row) => employeeLabelFromRow(row.employee, row.employee_id),
  })

  return (
    <HrmShowLayout
      title={pageTitle}
      listPath={listPath}
      listLabel={listLabel}
      isLoading={isLoading}
      error={!!error || !data}
      onDelete={() => deleteMutation.mutate()}
      isDeleting={deleteMutation.isPending}
      headerExtra={
        data?.status ? <Badge variant={statusVariant(data.status)}>{data.status}</Badge> : null
      }
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Employee'), value: personName(data.employee, data.employee_id) },
              { label: t('Type'), value: data.termination_type?.termination_type ?? '—' },
              { label: t('Notice date'), value: formatShortDate(data.notice_date) || '—' },
              { label: t('Termination date'), value: formatShortDate(data.termination_date) || '—' },
              { label: t('Reason'), value: data.reason || '—' },
            ]}
          />
          {data.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('Description')}</p>
              <p className="rounded-md bg-muted/40 p-3 text-sm">{data.description}</p>
            </div>
          )}
        </>
      )}
    </HrmShowLayout>
  )
}
