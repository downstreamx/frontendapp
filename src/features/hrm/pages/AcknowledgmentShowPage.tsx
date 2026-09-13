import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getAcknowledgment } from '../hrm-api'
import { employeeLabelFromRow, useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { personName } from '@/features/shared/lib/entity-labels'
import { getImagePath } from '@/utils/helpers'

export function AcknowledgmentShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'acknowledgments',
    listPath: '/hrm/acknowledgments',
    listLabel: t('Acknowledgments'),
    pageTitle: t('Acknowledgment'),
    queryFn: getAcknowledgment,
    getEmployeeName: (row) => employeeLabelFromRow(row.employee),
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
      headerExtra={data?.status ? <Badge variant="secondary">{data.status}</Badge> : null}
    >
      {data && (
        <HrmDetailGrid
          items={[
            { label: t('Employee'), value: personName(data.employee) },
            {
              label: t('Document'),
              value: data.document?.id ? (
                <Link to={`/hrm/documents/${data.document.id}`} className="text-primary hover:underline">
                  {data.document.title ?? t('View document')}
                </Link>
              ) : (
                '—'
              ),
            },
            { label: t('Status'), value: data.status ?? '—' },
            { label: t('Note'), value: data.acknowledgment_note ?? '—' },
            {
              label: t('Attachment'),
              value: data.document?.document ? (
                <a
                  href={getImagePath(data.document.document)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('Open file')}
                </a>
              ) : null,
            },
          ]}
        />
      )}
    </HrmShowLayout>
  )
}
