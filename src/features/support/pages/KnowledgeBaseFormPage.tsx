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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createKnowledgeBase, getKnowledgeBase, updateKnowledgeBase } from '../support-api'

export function KnowledgeBaseFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const articleQuery = useQuery({
    queryKey: ['support-ticket', 'knowledge-bases', id],
    queryFn: () => getKnowledgeBase(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = articleQuery.data
    if (!row) return
    setTitle(row.title)
    setCategory(row.category ?? '')
    setDescription(row.description ?? '')
  }, [articleQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit article') : t('Create article'),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('Knowledge base'), url: paths.support.knowledgeBase },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description,
        category: category || undefined,
      }
      return isEdit ? updateKnowledgeBase(Number(id), payload) : createKnowledgeBase(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Article updated') : t('Article created'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'knowledge-bases'] })
      navigate(paths.support.knowledgeBaseShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save article'))),
  })

  if (isEdit && articleQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit article') : t('Create article')}</CardTitle>
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
            <Label>{t('Category')}</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('General')} />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link
                to={
                  isEdit && id ? paths.support.knowledgeBaseShow(id) : paths.support.knowledgeBase
                }
              >
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
