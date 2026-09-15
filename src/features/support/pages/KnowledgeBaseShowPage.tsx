import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getKnowledgeBase } from '../support-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function KnowledgeBaseShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: article, isLoading } = useQuery({
    queryKey: ['support-ticket', 'knowledge-bases', id],
    queryFn: () => getKnowledgeBase(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: article?.title ?? t('Article'),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('Knowledge base'), url: paths.support.knowledgeBase },
      { label: article?.title ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!article) return <p className="text-sm text-destructive">{t('Article not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{article.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.support.knowledgeBaseEdit(article.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.support.knowledgeBase}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">{t('Category')}:</span> {article.category ?? '—'}
          </p>
          {article.description ? (
            <p className="whitespace-pre-wrap">{article.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
