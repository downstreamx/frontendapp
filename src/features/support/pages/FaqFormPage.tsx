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
import { createFaq, getFaq, updateFaq } from '../support-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function FaqFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const faqQuery = useQuery({
    queryKey: ['support-ticket', 'faqs', id],
    queryFn: () => getFaq(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = faqQuery.data
    if (!row) return
    setTitle(row.title)
    setDescription(row.description ?? '')
  }, [faqQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit FAQ') : t('Create FAQ'),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('FAQs'), url: paths.support.faqs },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { title, description }
      return isEdit ? updateFaq(Number(id), payload) : createFaq(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('FAQ updated') : t('FAQ created'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'faqs'] })
      navigate(paths.support.faqShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save FAQ'))),
  })

  if (isEdit && faqQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit FAQ') : t('Create FAQ')}</CardTitle>
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
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.support.faqShow(id) : paths.support.faqs}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
