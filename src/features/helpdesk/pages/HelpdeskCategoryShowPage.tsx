import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getHelpdeskCategory } from '../helpdesk-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function HelpdeskCategoryShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: category, isLoading } = useQuery({
    queryKey: ['helpdesk', 'categories', id],
    queryFn: () => getHelpdeskCategory(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: category?.name ?? t('Category'),
    breadcrumbs: [
      { label: t('Helpdesk') },
      { label: t('Categories'), url: paths.helpdeskCategories },
      { label: category?.name ?? `#${id}` },
    ],
  })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (!category) {
    return <div className="text-sm text-destructive">{t('Category not found.')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: category.color ?? '#6366f1' }}
          />
          {category.name}
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.helpdeskCategoryEdit(category.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.helpdeskCategories}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {category.description ? (
            <div className="whitespace-pre-wrap">{category.description}</div>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
