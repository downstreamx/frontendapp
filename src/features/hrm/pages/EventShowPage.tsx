import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmHtmlContent } from '../components/HrmHtmlContent'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getEvent } from '../hrm-api'
import { useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate } from '@/features/shared/lib/entity-labels'

export function EventShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'events',
    listPath: '/hrm/events',
    listLabel: t('Events'),
    pageTitle: t('Event'),
    queryFn: getEvent,
    getEmployeeName: (row) => row.title,
  })

  return (
    <HrmShowLayout
      title={data?.title ?? pageTitle}
      listPath={listPath}
      listLabel={listLabel}
      isLoading={isLoading}
      error={!!error || !data}
      onDelete={() => deleteMutation.mutate()}
      isDeleting={deleteMutation.isPending}
      headerExtra={data?.status ? <Badge variant="secondary">{data.status}</Badge> : null}
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Type'), value: data.event_type?.event_type ?? '—' },
              { label: t('Location'), value: data.location ?? '—' },
              {
                label: t('Schedule'),
                value: `${formatShortDate(data.start_date) || '—'} → ${formatShortDate(data.end_date) || '—'}`,
              },
              {
                label: t('Time'),
                value:
                  data.start_time || data.end_time
                    ? `${data.start_time ?? '—'} – ${data.end_time ?? '—'}`
                    : null,
              },
            ]}
          />
          {data.description && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('Description')}</p>
              <HrmHtmlContent html={data.description} />
            </div>
          )}
        </>
      )}
    </HrmShowLayout>
  )
}
