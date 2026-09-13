import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  fetchEmailTemplateLanguage,
  fetchEmailTemplateForEdit,
  updateEmailTemplateContent,
  updateEmailTemplateMeta,
} from '../email-templates-api'

export function EmailTemplateEditPage() {
  const { id } = useParams<{ id: string }>()
  const templateId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const activeLang = searchParams.get('lang') ?? 'en'
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)

  const editQuery = useQuery({
    queryKey: ['email-templates', templateId, 'edit', activeLang],
    queryFn: () => fetchEmailTemplateForEdit(templateId, activeLang),
    enabled: Number.isFinite(templateId),
  })

  const template = editQuery.data?.template
  const variables = editQuery.data?.content.variables ?? {}
  const languages = editQuery.data?.languages ?? []

  usePageChrome({
    pageTitle: template?.name ?? t('Edit email template'),
    breadcrumbs: [
      { label: t('Email templates'), url: paths.emailTemplates },
      { label: template?.name ?? t('Edit') },
    ],
  })

  useEffect(() => {
    if (!editQuery.data) return
    setFrom(editQuery.data.template.from ?? '')
    setSubject(editQuery.data.content.subject)
    setContent(editQuery.data.content.content)
    setEditorKey((k) => k + 1)
  }, [editQuery.data])

  const changeLanguage = async (lang: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('lang', lang)
    setSearchParams(next)
    try {
      const row = await fetchEmailTemplateLanguage(templateId, lang)
      setSubject(row.subject)
      setContent(row.content)
      setEditorKey((k) => k + 1)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('Failed to load language')))
    }
  }

  const metaMutation = useMutation({
    mutationFn: () => updateEmailTemplateMeta(templateId, { from }),
    onSuccess: () => {
      toast.success(t('Sender name updated'))
      void queryClient.invalidateQueries({ queryKey: ['email-templates', templateId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update sender'))),
  })

  const contentMutation = useMutation({
    mutationFn: () =>
      updateEmailTemplateContent(templateId, {
        lang: activeLang,
        subject,
        content,
      }),
    onSuccess: () => {
      toast.success(t('Email template saved'))
      void queryClient.invalidateQueries({ queryKey: ['email-templates', templateId] })
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
            <Link to={paths.emailTemplates}>{t('Back')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Template details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                metaMutation.mutate()
              }}
            >
              <div className="space-y-1">
                <Label>{t('Name')}</Label>
                <Input value={template.name} disabled />
              </div>
              <div className="space-y-1">
                <Label>{t('From name')}</Label>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} required />
              </div>
              <Button type="submit" size="sm" disabled={metaMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {t('Save sender')}
              </Button>
            </form>
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
                contentMutation.mutate()
              }}
            >
              <div className="space-y-1">
                <Label>{t('Subject')}</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('Enter email subject')}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Email message')}</Label>
                <RichTextEditor
                  key={editorKey}
                  content={content}
                  onChange={setContent}
                  placeholder={t('Enter email content')}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={contentMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {contentMutation.isPending ? t('Saving…') : t('Save content')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
