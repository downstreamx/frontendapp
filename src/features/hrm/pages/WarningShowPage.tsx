import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getWarning } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'

export function WarningShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'warnings',
    listPath: '/hrm/warnings',
    listLabel: t('Warnings'),
    pageTitle: t('Warning'),
    queryFn: getWarning,
    getEmployeeName: (row) => employeeLabelFromRow(row.employee, row.employee_id),
  })

  return (
    <HrmShowLayout
      title={data?.subject ?? pageTitle}
      listPath={listPath}
      listLabel={listLabel}
      isLoading={isLoading}
      error={!!error || !data}
      onDelete={() => deleteMutation.mutate()}
      isDeleting={deleteMutation.isPending}
      headerExtra={data?.severity ? <Badge variant="secondary">{data.severity}</Badge> : null}
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Employee'), value: personName(data.employee, data.employee_id) },
              { label: t('Type'), value: data.warning_type?.warning_type_name ?? '—' },
              { label: t('Date'), value: formatShortDate(data.warning_date) || '—' },
              { label: t('Subject'), value: data.subject ?? '—' },
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
