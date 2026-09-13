import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmHtmlContent } from '../components/HrmHtmlContent'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getAnnouncement } from '../hrm-api'
import { useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate } from '@/features/shared/lib/entity-labels'

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default'
  if (status === 'inactive') return 'destructive'
  return 'secondary'
}

export function AnnouncementShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle } = useHrmRecordShow({
    entityKey: 'announcements',
    listPath: '/hrm/announcements',
    listLabel: t('Announcements'),
    pageTitle: t('Announcement'),
    queryFn: getAnnouncement,
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
      headerExtra={
        data?.status ? <Badge variant={statusVariant(data.status)}>{data.status}</Badge> : null
      }
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Category'), value: data.announcement_category?.announcement_category ?? '—' },
              { label: t('Priority'), value: data.priority ?? '—' },
              { label: t('Start date'), value: formatShortDate(data.start_date) || '—' },
              { label: t('End date'), value: formatShortDate(data.end_date) || '—' },
              { label: t('Approved by'), value: data.approved_by?.name },
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
