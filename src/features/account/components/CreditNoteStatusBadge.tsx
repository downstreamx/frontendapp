import { useTranslation } from 'react-i18next'
import {
  formatCreditNoteStatusLabel,
  getCreditNoteStatusBadgeClasses,
} from '../credit-note-utils'

export function CreditNoteStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()

  return (
    <span className={getCreditNoteStatusBadgeClasses(status)}>
      {formatCreditNoteStatusLabel(status, t)}
    </span>
  )
}
