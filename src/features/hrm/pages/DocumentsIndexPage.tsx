import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { extractListRows, useResourceList } from '@/hooks/use-resource-list'
import { createRestCrudApi } from '@/lib/crud-api'
import { dateColumn, statusColumn } from '../hrm-list-columns'
import {
  createHrmDocument,
  getHrmDocument,
  updateHrmDocument,
} from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'
import {
  emptyHrmDocumentForm,
  HrmDocumentFormFields,
  type HrmDocumentFormState,
} from '../components/HrmDocumentFormFields'

const showPath = (id: number | string) => `/hrm/documents/${id}`

function buildFormData(
  form: HrmDocumentFormState,
  file: File | null,
  removeDocument: boolean,
): FormData {
  const body = new FormData()
  body.append('title', form.title)
  if (form.categoryId) body.append('document_category_id', form.categoryId)
  if (form.effectiveDate) body.append('effective_date', form.effectiveDate)
  if (form.description) body.append('description', form.description)
  if (file) body.append('file', file)
  if (removeDocument) body.append('remove_document', '1')
  return body
}

export function DocumentsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const { documentCategoryOptions, isLoading: metaLoading } = useHrmMeta()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<HrmDocumentFormState>(emptyHrmDocumentForm)
  const [file, setFile] = useState<File | null>(null)
  const [removeDocument, setRemoveDocument] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const isEdit = editingId != null
  const crud = useMemo(() => createRestCrudApi<Record<string, unknown>>('/hrm/documents'), [])

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-hrm-documents')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-hrm-documents')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-hrm-documents')

  usePageChrome({
    pageTitle: t('Documents'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Documents') }],
  })

  const { data, isLoading, error } = useResourceList('hrm-documents', '/hrm/documents')
  const rows = extractListRows<Record<string, unknown>>(data)

  const { data: editingDocument, isLoading: detailLoading } = useQuery({
    queryKey: ['hrm', 'documents', editingId],
    queryFn: () => getHrmDocument(editingId!),
    enabled: dialogOpen && isEdit && editingId != null,
  })

  useEffect(() => {
    if (!dialogOpen || !isEdit || !editingDocument) return
    setForm({
      title: editingDocument.title ?? '',
      categoryId: editingDocument.document_category_id
        ? String(editingDocument.document_category_id)
        : '',
      effectiveDate: editingDocument.effective_date?.slice(0, 10) ?? '',
      description: editingDocument.description ?? '',
    })
    setFile(null)
    setRemoveDocument(false)
  }, [dialogOpen, editingDocument, isEdit])

  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (!editParam || !canEdit) return
    const id = Number(editParam)
    if (!Number.isFinite(id)) return
    setEditingId(id)
    setForm(emptyHrmDocumentForm())
    setDialogOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('edit')
      return next
    })
  }, [canEdit, searchParams, setSearchParams])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['hrm-documents'] })

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = buildFormData(form, file, removeDocument)
      return isEdit && editingId != null
        ? updateHrmDocument(editingId, body)
        : createHrmDocument(body)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Document updated') : t('Document created'))
      invalidate()
      closeDialog()
      navigate(showPath(row.id))
    },
    onError: () => toast.error(t('Failed to save document')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crud.remove(id),
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: () => toast.error(t('Failed to delete')),
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyHrmDocumentForm())
    setFile(null)
    setRemoveDocument(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyHrmDocumentForm())
    setFile(null)
    setRemoveDocument(false)
    setDialogOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setForm(emptyHrmDocumentForm())
    setFile(null)
    setRemoveDocument(false)
    setDialogOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(t('Title is required'))
      return
    }
    saveMutation.mutate()
  }

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('Title'),
        render: (_, row) =>
          row.id != null ? (
            <Link to={showPath(row.id as number)} className="font-medium text-primary hover:underline">
              {String(row.title ?? '—')}
            </Link>
          ) : (
            String(row.title ?? '—')
          ),
      },
      {
        key: 'document_category',
        header: t('Category'),
        render: (_, row) =>
          String((row.document_category as { document_type?: string })?.document_type ?? '—'),
      },
      dateColumn('effective_date', t('Effective')),
      statusColumn(),
      {
        key: 'actions',
        header: t('Action'),
        render: (_value, row) => (
          <TableRowActions
            onView={row.id != null ? () => navigate(showPath(row.id as number)) : undefined}
            editPermission="edit-hrm-documents"
            deletePermission="delete-hrm-documents"
            onEdit={row.id != null && canEdit ? () => openEdit(Number(row.id)) : undefined}
            onDelete={row.id != null && canDelete ? () => setDeleteId(Number(row.id)) : undefined}
          />
        ),
      },
    ],
    [canDelete, canEdit, navigate, t],
  )

  return (
    <>
      <ModuleListCard
        title={t('Documents')}
        description={t('Manage employee documents and files.')}
        canCreate={canCreate}
        onCreateClick={canCreate ? openCreate : undefined}
        isLoading={isLoading}
        error={!!error}
      >
        <DataTable
          data={rows}
          columns={columns}
          className="rounded-none border-0 shadow-none"
          emptyState={
            <NoRecordsFound
              icon={FileText}
              title={t('No documents found')}
              description={t('Get started by creating your first record.')}
              createPermission="create-hrm-documents"
              onCreateClick={canCreate ? openCreate : undefined}
              createButtonText={t('Create Documents')}
              className="h-auto py-8"
            />
          }
        />
      </ModuleListCard>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('Edit document') : t('Create document')}</DialogTitle>
          </DialogHeader>
          {detailLoading && isEdit ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <HrmDocumentFormFields
                form={form}
                onChange={setForm}
                categoryOptions={documentCategoryOptions}
                metaLoading={metaLoading}
                isEdit={isEdit}
                hasExistingFile={Boolean(editingDocument?.document)}
                removeDocument={removeDocument}
                onRemoveDocumentChange={setRemoveDocument}
                onFileChange={setFile}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete Documents')}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
