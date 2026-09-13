import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmOrgRoleTransition } from '../components/HrmOrgRoleTransition'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getPromotion } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'
import { getImagePath } from '@/utils/helpers'

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export function PromotionShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'promotions',
    listPath: '/hrm/promotions',
    listLabel: t('Promotions'),
    pageTitle: t('Promotion'),
    queryFn: getPromotion,
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
                label: t('Document'),
                value: (data as { document?: string }).document ? (
                  <a
                    href={getImagePath((data as { document?: string }).document!)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('Download document')}
                  </a>
                ) : null,
              },
              {
                label: t('Approved by'),
                value: (data as { approved_by?: { name?: string } }).approved_by?.name,
              },
            ]}
          />
          <HrmOrgRoleTransition
            from={{
              branch: data.previous_branch,
              department: data.previous_department,
              designation: data.previous_designation,
            }}
            to={{
              branch: data.current_branch,
              department: data.current_department,
              designation: data.current_designation,
            }}
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
