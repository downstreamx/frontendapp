import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/utils/helpers'

type Log = {
  id: number
  log_type?: string
  remark?: string
  created_at?: string
  user?: { id: number; name: string }
}

export function ProjectActivityFeed({ logs }: { logs: Log[] }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('Recent Activity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid max-h-96 gap-3 overflow-y-auto text-sm sm:grid-cols-2">
          {logs.map((log) => (
            <li key={log.id} className="rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">{log.user?.name ?? t('System')}</p>
              {log.remark ? (
                <p
                  className="mt-1 text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: log.remark }}
                />
              ) : (
                <p className="mt-1 text-muted-foreground">{log.log_type}</p>
              )}
              {log.created_at ? (
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
              ) : null}
            </li>
          ))}
          {logs.length === 0 && <li className="text-muted-foreground">{t('No activity yet.')}</li>}
        </ul>
      </CardContent>
    </Card>
  )
}
