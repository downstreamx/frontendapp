import { useTranslation } from 'react-i18next'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getAward } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate, personName } from '@/features/shared/lib/entity-labels'
import { getImagePath } from '@/utils/helpers'

export function AwardShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'awards',
    listPath: '/hrm/awards',
    listLabel: t('Awards'),
    pageTitle: t('Award'),
    queryFn: getAward,
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
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Employee'), value: personName(data.employee, data.employee_id) },
              { label: t('Award type'), value: data.award_type?.name ?? '—' },
              { label: t('Award date'), value: formatShortDate(data.award_date) || '—' },
              {
                label: t('Certificate'),
                value: data.certificate ? (
                  <a
                    href={getImagePath(data.certificate)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('View certificate')}
                  </a>
                ) : (
                  '—'
                ),
              },
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
