import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { LeadRecord } from '../api'
import { formatDate } from '@/utils/helpers'

type Props = { lead: LeadRecord }

export function LeadGeneralSection({ lead }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{lead.name}</h2>
          {lead.stage?.name && <Badge variant="secondary">{lead.stage.name}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{lead.email ? '1' : '0'}</div>
            <div className="text-sm text-muted-foreground">{t('Email')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{lead.tasks?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">{t('Tasks')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{lead.files?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">{t('Files')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{lead.calls?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">{t('Calls')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">{t('Email')}</span>
            <p className="text-muted-foreground mt-1">{lead.email ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium">{t('Phone')}</span>
            <p className="text-muted-foreground mt-1">{lead.phone ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium">{t('Subject')}</span>
            <p className="text-muted-foreground mt-1">{lead.subject ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium">{t('Pipeline')}</span>
            <p className="text-muted-foreground mt-1">{lead.pipeline?.name ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium">{t('Owner')}</span>
            <p className="text-muted-foreground mt-1">{lead.user?.name ?? '—'}</p>
          </div>
          <div>
            <span className="font-medium">{t('Date')}</span>
            <p className="text-muted-foreground mt-1">
              {lead.date ? formatDate(lead.date) : '—'}
            </p>
          </div>
          {lead.notes && (
            <div className="md:col-span-2">
              <span className="font-medium">{t('Notes')}</span>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
