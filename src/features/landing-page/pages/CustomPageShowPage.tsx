import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getCustomPage } from '../landing-page-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function CustomPageShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: page, isLoading } = useQuery({
    queryKey: ['landing-page', 'pages', id],
    queryFn: () => getCustomPage(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: page?.title ?? t('Custom page'),
    breadcrumbs: [
      { label: t('Landing page'), url: paths.landingPage },
      { label: t('Custom pages'), url: paths.landingPagePages },
      { label: page?.title ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!page) return <p className="text-sm text-destructive">{t('Page not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{page.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.landingPagePageEdit(page.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.landingPagePages}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            /{page.slug}
            <FleetStatusBadge status={page.is_active === false ? 'inactive' : 'active'} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {page.meta_title ? (
            <p>
              <span className="font-medium">{t('Meta title')}:</span> {page.meta_title}
            </p>
          ) : null}
          {page.meta_description ? (
            <p>
              <span className="font-medium">{t('Meta description')}:</span> {page.meta_description}
            </p>
          ) : null}
          <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">{page.content}</div>
        </CardContent>
      </Card>
    </div>
  )
}
