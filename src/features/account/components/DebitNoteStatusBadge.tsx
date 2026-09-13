import { useTranslation } from 'react-i18next'
import {
  formatDebitNoteStatusLabel,
  getDebitNoteStatusBadgeClasses,
} from '../debit-note-utils'

export function DebitNoteStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()

  return (
    <span className={getDebitNoteStatusBadgeClasses(status)}>
      {formatDebitNoteStatusLabel(status, t)}
    </span>
  )
}
