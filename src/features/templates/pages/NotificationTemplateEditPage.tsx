import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
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
import {
  fetchNotificationTemplateForEdit,
  fetchNotificationTemplateLanguage,
  updateNotificationTemplateContent,
} from '../notification-templates-api'

export function NotificationTemplateEditPage() {
  const { id } = useParams<{ id: string }>()
  const templateId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const activeLang = searchParams.get('lang') ?? 'en'
  const [content, setContent] = useState('')

  const editQuery = useQuery({
    queryKey: ['notification-templates', templateId, 'edit', activeLang],
    queryFn: () => fetchNotificationTemplateForEdit(templateId, activeLang),
    enabled: Number.isFinite(templateId),
  })

  const template = editQuery.data?.template
  const subject = editQuery.data?.content.subject ?? template?.action ?? ''
  const variables = editQuery.data?.content.variables ?? {}
  const languages = editQuery.data?.languages ?? []

  usePageChrome({
    pageTitle: template?.action ?? t('Edit notification template'),
    breadcrumbs: [
      { label: t('Notification templates'), url: paths.notificationTemplates },
      { label: template?.action ?? t('Edit') },
    ],
  })

  useEffect(() => {
    if (!editQuery.data) return
    setContent(editQuery.data.content.content)
  }, [editQuery.data])

  const changeLanguage = async (lang: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('lang', lang)
    setSearchParams(next)
    try {
      const row = await fetchNotificationTemplateLanguage(templateId, lang)
      setContent(row.content)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('Failed to load language')))
    }
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateNotificationTemplateContent(templateId, {
        lang: activeLang,
        content,
      }),
    onSuccess: () => {
      toast.success(t('Notification template saved'))
      void queryClient.invalidateQueries({ queryKey: ['notification-templates', templateId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save template'))),
  })

  if (editQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t('Template not found')}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to={paths.notificationTemplates}>{t('Back')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Variables')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(variables).length === 0 ? (
              <p className="text-muted-foreground">{t('No variables for this template.')}</p>
            ) : (
              Object.entries(variables).map(([label, key]) => (
                <p key={label}>
                  {label}: <span className="font-mono text-primary">{`{${key}}`}</span>
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">
              {t('Content')} — {languages.find((l) => l.code === activeLang)?.name ?? activeLang}
            </CardTitle>
            <Select value={activeLang} onValueChange={changeLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <Label>{t('Subject')}</Label>
                <Input value={subject} readOnly />
              </div>
              <div className="space-y-1">
                <Label>{t('Notification message')}</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('Enter notification content with variables')}
                  rows={12}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {saveMutation.isPending ? t('Saving…') : t('Save content')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
