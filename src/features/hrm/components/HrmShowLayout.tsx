import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type Props = {
  title: string
  listPath: string
  listLabel: string
  isLoading?: boolean
  error?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  headerExtra?: ReactNode
  children: ReactNode
}

export function HrmShowLayout({
  title,
  listPath,
  listLabel,
  isLoading,
  error,
  onDelete,
  isDeleting,
  headerExtra,
  children,
}: Props) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <PageContentLoader className="min-h-[16rem]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <p className="text-sm text-destructive">{t('Could not load record.')}</p>
        <Button variant="link" asChild className="mt-2 px-0">
          <Link to={listPath}>{t('Back to {{label}}', { label: listLabel })}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={listPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Back to {{label}}', { label: listLabel })}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {headerExtra}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('Delete')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">{children}</CardContent>
      </Card>
    </div>
  )
}
