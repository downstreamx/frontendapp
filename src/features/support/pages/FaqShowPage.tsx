import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getFaq } from '../support-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function FaqShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: faq, isLoading } = useQuery({
    queryKey: ['support-ticket', 'faqs', id],
    queryFn: () => getFaq(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: faq?.title ?? t('FAQ'),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('FAQs'), url: paths.support.faqs },
      { label: faq?.title ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!faq) return <p className="text-sm text-destructive">{t('FAQ not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{faq.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.support.faqEdit(faq.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.support.faqs}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Answer')}</CardTitle>
        </CardHeader>
        <CardContent>
          {faq.description ? (
            <p className="whitespace-pre-wrap text-sm">{faq.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
