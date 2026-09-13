import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getComplaint } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'resolved' || status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export function ComplaintShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'complaints',
    listPath: '/hrm/complaints',
    listLabel: t('Complaints'),
    pageTitle: t('Complaint'),
    queryFn: getComplaint,
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
      headerExtra={
        data?.status ? <Badge variant={statusVariant(data.status)}>{data.status}</Badge> : null
      }
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Complainant'), value: personName(data.employee, data.employee_id) },
              {
                label: t('Against'),
                value: personName(data.against_employee, data.against_employee_id),
              },
              { label: t('Type'), value: data.complaint_type?.complaint_type ?? '—' },
              { label: t('Date'), value: formatShortDate(data.complaint_date) || '—' },
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
