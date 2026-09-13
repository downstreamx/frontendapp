import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmOrgRoleTransition } from '../components/HrmOrgRoleTransition'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getEmployeeTransfer } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved' || status === 'completed') return 'default'
  if (status === 'rejected' || status === 'cancelled') return 'destructive'
  return 'secondary'
}

export function EmployeeTransferShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'employee-transfers',
    listPath: '/hrm/employee-transfers',
    listLabel: t('Transfers'),
    pageTitle: t('Transfer'),
    queryFn: getEmployeeTransfer,
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
              { label: t('Effective date'), value: formatShortDate(data.effective_date) || '—' },
              {
                label: t('Transfer date'),
                value: data.transfer_date ? formatShortDate(data.transfer_date) : null,
              },
            ]}
          />
          <HrmOrgRoleTransition
            from={{
              branch: data.from_branch,
              department: data.from_department,
              designation: data.from_designation,
            }}
            to={{
              branch: data.to_branch,
              department: data.to_department,
              designation: data.to_designation,
            }}
            fromTitle={t('From')}
            toTitle={t('To')}
          />
          {data.reason && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('Reason')}</p>
              <p className="rounded-md bg-muted/40 p-3 text-sm">{data.reason}</p>
            </div>
          )}
        </>
      )}
    </HrmShowLayout>
  )
}
