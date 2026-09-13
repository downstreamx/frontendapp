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
import { createHelpdeskCategory, getHelpdeskCategory, updateHelpdeskCategory } from '../helpdesk-api'

export function HelpdeskCategoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const categoryQuery = useQuery({
    queryKey: ['helpdesk', 'categories', id],
    queryFn: () => getHelpdeskCategory(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = categoryQuery.data
    if (!row) return
    setName(row.name)
    setDescription(row.description ?? '')
    setColor(row.color ?? '#6366f1')
  }, [categoryQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit category') : t('Create category'),
    breadcrumbs: [
      { label: t('Helpdesk') },
      { label: t('Categories'), url: paths.helpdeskCategories },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name, description: description || undefined, color }
      return isEdit ? updateHelpdeskCategory(Number(id), payload) : createHelpdeskCategory(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Category updated') : t('Category created'))
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'categories'] })
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'meta'] })
      navigate(paths.helpdeskCategoryShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save category'))),
  })

  if (isEdit && categoryQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t('Loading…')}</div>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit category') : t('Create category')}</CardTitle>
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
            <Label>{t('Name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>{t('Color')}</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link
                to={
                  isEdit && id ? paths.helpdeskCategoryShow(id) : paths.helpdeskCategories
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
