import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EntitySelect } from '@/components/forms/entity-select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

export type HrmDocumentFormState = {
  title: string
  categoryId: string
  effectiveDate: string
  description: string
}

type Props = {
  form: HrmDocumentFormState
  onChange: (next: HrmDocumentFormState) => void
  categoryOptions: Array<{ id: number; label: string }>
  metaLoading?: boolean
  isEdit?: boolean
  hasExistingFile?: boolean
  removeDocument: boolean
  onRemoveDocumentChange: (remove: boolean) => void
  onFileChange: (file: File | null) => void
}

export function HrmDocumentFormFields({
  form,
  onChange,
  categoryOptions,
  metaLoading,
  isEdit,
  hasExistingFile,
  removeDocument,
  onRemoveDocumentChange,
  onFileChange,
}: Props) {
  const { t } = useTranslation()

  const setField = <K extends keyof HrmDocumentFormState>(
    key: K,
    value: HrmDocumentFormState[K],
  ) => {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t('Title')}</Label>
        <Input
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Category')}</Label>
        <EntitySelect
          value={form.categoryId}
          onValueChange={(value) => setField('categoryId', value)}
          options={categoryOptions}
          placeholder={t('Select category')}
          disabled={metaLoading}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Effective date')}</Label>
        <Input
          type="date"
          value={form.effectiveDate}
          onChange={(e) => setField('effectiveDate', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Description')}</Label>
        <RichTextEditor content={form.description} onChange={(value) => setField('description', value)} />
      </div>
      <div className="space-y-1">
        <Label>{t('File')}</Label>
        <Input
          type="file"
          onChange={(e) => {
            onFileChange(e.target.files?.[0] ?? null)
            onRemoveDocumentChange(false)
          }}
        />
        {isEdit && hasExistingFile && !removeDocument ? (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeDocument}
              onChange={(e) => onRemoveDocumentChange(e.target.checked)}
            />
            {t('Remove current file')}
          </label>
        ) : null}
      </div>
    </div>
  )
}

export const emptyHrmDocumentForm = (): HrmDocumentFormState => ({
  title: '',
  categoryId: '',
  effectiveDate: '',
  description: '',
})
