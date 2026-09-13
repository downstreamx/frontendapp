import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HrmDetailGrid } from '../components/HrmDetailGrid'
import { HrmHtmlContent } from '../components/HrmHtmlContent'
import { HrmShowLayout } from '../components/HrmShowLayout'
import { getHrmDocument } from '../hrm-api'
import { useHrmRecordShow } from '../hooks/use-hrm-record-show'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import { getImagePath } from '@/utils/helpers'

export function HrmDocumentShowPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, deleteMutation, listPath, listLabel, pageTitle, recordId } =
    useHrmRecordShow({
      entityKey: 'documents',
      listPath: '/hrm/documents',
      listLabel: t('Documents'),
      pageTitle: t('Document'),
      queryFn: getHrmDocument,
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
        <div className="flex items-center gap-2">
          {data?.status ? <Badge variant="secondary">{data.status}</Badge> : null}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/hrm/documents?edit=${recordId}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('Edit')}
            </Link>
          </Button>
        </div>
      }
    >
      {data && (
        <>
          <HrmDetailGrid
            items={[
              { label: t('Category'), value: data.document_category?.document_type ?? '—' },
              { label: t('Effective date'), value: formatShortDate(data.effective_date) || '—' },
              { label: t('Uploaded by'), value: data.uploaded_by?.name },
              { label: t('Approved by'), value: data.approved_by?.name },
              {
                label: t('File'),
                value: data.document ? (
                  <a
                    href={getImagePath(data.document)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('Download document')}
                  </a>
                ) : (
                  '—'
                ),
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
