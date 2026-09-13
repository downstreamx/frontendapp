import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EntitySelect } from '@/components/forms/entity-select'

export type SupportTicketFormState = {
  subject: string
  description: string
  categoryId: string
}

type Props = {
  form: SupportTicketFormState
  onChange: (next: SupportTicketFormState) => void
  categoryOptions: Array<{ id: number; label: string }>
  metaLoading?: boolean
}

export function SupportTicketFormFields({
  form,
  onChange,
  categoryOptions,
  metaLoading,
}: Props) {
  const { t } = useTranslation()

  const setField = <K extends keyof SupportTicketFormState>(
    key: K,
    value: SupportTicketFormState[K],
  ) => {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t('Subject')}</Label>
        <Input
          value={form.subject}
          onChange={(e) => setField('subject', e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Category')}</Label>
        <EntitySelect
          value={form.categoryId}
          onValueChange={(value) => setField('categoryId', value)}
          options={categoryOptions}
          disabled={metaLoading}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Description')}</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          required
          rows={4}
        />
      </div>
    </div>
  )
}

export const emptySupportTicketForm = (): SupportTicketFormState => ({
  subject: '',
  description: '',
  categoryId: '',
})
