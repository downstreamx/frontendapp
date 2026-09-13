import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { createHrmDocument, getHrmDocument, updateHrmDocument } from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'
import {
  emptyHrmDocumentForm,
  HrmDocumentFormFields,
  type HrmDocumentFormState,
} from '../components/HrmDocumentFormFields'

/** @deprecated Use modal on DocumentsIndexPage; routes redirect to the list. */
export function HrmDocumentFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const recordId = Number(id)
  const navigate = useNavigate()
  const { documentCategoryOptions, isLoading: metaLoading } = useHrmMeta()

  const [form, setForm] = useState<HrmDocumentFormState>(emptyHrmDocumentForm)
  const [file, setFile] = useState<File | null>(null)
  const [removeDocument, setRemoveDocument] = useState(false)

  const detailQuery = useQuery({
    queryKey: ['hrm', 'documents', recordId],
    queryFn: () => getHrmDocument(recordId),
    enabled: isEdit && Number.isFinite(recordId),
  })

  usePageChrome({
    pageTitle: isEdit ? t('Edit document') : t('Create document'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Documents'), url: '/hrm/documents' },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  useEffect(() => {
    const row = detailQuery.data
    if (!row) return
    setForm({
      title: row.title ?? '',
      categoryId: row.document_category_id ? String(row.document_category_id) : '',
      effectiveDate: row.effective_date?.slice(0, 10) ?? '',
      description: row.description ?? '',
    })
  }, [detailQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData()
      body.append('title', form.title)
      if (form.categoryId) body.append('document_category_id', form.categoryId)
      if (form.effectiveDate) body.append('effective_date', form.effectiveDate)
      if (form.description) body.append('description', form.description)
      if (file) body.append('file', file)
      if (removeDocument) body.append('remove_document', '1')
      if (isEdit) return updateHrmDocument(recordId, body)
      return createHrmDocument(body)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Document updated') : t('Document created'))
      navigate(`/hrm/documents/${row.id}`)
    },
    onError: () => toast.error(t('Failed to save document')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(t('Title is required'))
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/hrm/documents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to documents')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? t('Edit document') : t('Create document')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <HrmDocumentFormFields
              form={form}
              onChange={setForm}
              categoryOptions={documentCategoryOptions}
              metaLoading={metaLoading}
              isEdit={isEdit}
              hasExistingFile={Boolean(detailQuery.data?.document)}
              removeDocument={removeDocument}
              onRemoveDocumentChange={setRemoveDocument}
              onFileChange={setFile}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/hrm/documents')}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || detailQuery.isLoading}>
                {t('Save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
