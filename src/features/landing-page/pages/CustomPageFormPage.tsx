import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createCustomPage, getCustomPage, updateCustomPage } from '../landing-page-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function CustomPageFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [isActive, setIsActive] = useState('true')

  const pageQuery = useQuery({
    queryKey: ['landing-page', 'pages', id],
    queryFn: () => getCustomPage(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = pageQuery.data
    if (!row) return
    setTitle(row.title)
    setSlug(row.slug)
    setContent(row.content)
    setMetaTitle(row.meta_title ?? '')
    setMetaDescription(row.meta_description ?? '')
    setIsActive(row.is_active === false ? 'false' : 'true')
  }, [pageQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit page') : t('Create page'),
    breadcrumbs: [
      { label: t('Landing page'), url: paths.landingPage },
      { label: t('Custom pages'), url: paths.landingPagePages },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        slug: slug || undefined,
        content,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        is_active: isActive === 'true',
      }
      return isEdit ? updateCustomPage(Number(id), payload) : createCustomPage(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Page updated') : t('Page created'))
      void queryClient.invalidateQueries({ queryKey: ['landing-page', 'pages'] })
      navigate(paths.landingPagePageShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save page'))),
  })

  if (isEdit && pageQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit custom page') : t('Create custom page')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('URL slug')}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" />
          </div>
          <div className="space-y-1">
            <Label>{t('Content')}</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Meta title')}</Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('Active')}</SelectItem>
                  <SelectItem value="false">{t('Inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Meta description')}</Label>
            <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.landingPagePageShow(id) : paths.landingPagePages}>
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
