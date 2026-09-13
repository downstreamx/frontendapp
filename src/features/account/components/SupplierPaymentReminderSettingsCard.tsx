import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { PaymentReminderScheduleCard } from '@/features/_shared/components/PaymentReminderScheduleCard'
import { commercialInvoiceGoldenPanelClass } from '@/features/commercial/commercial-page-styles'
import {
  getSupplierPaymentReminderSettings,
  updateSupplierPaymentReminderSettings,
} from '../supplier-payment-reminder-settings-api'

type Props = {
  supplierId: number
}

export function SupplierPaymentReminderSettingsCard({ supplierId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-suppliers')

  const settingsQuery = useQuery({
    queryKey: ['account', 'suppliers', supplierId, 'payment-reminder-settings'],
    queryFn: () => getSupplierPaymentReminderSettings(supplierId),
  })

  return (
    <PaymentReminderScheduleCard
      className={commercialInvoiceGoldenPanelClass}
      title={t('Payment reminders')}
      description={t(
        'Schedule when your company receives payment reminder emails for this supplier’s open purchase invoices.',
      )}
      partyHintWhenCompanyOff={t(
        'Company-wide purchase reminders are off. This supplier uses the schedule below when reminders are enabled.',
      )}
      settings={settingsQuery.data}
      isLoading={settingsQuery.isLoading}
      canEdit={canEdit}
      onSave={(payload) => updateSupplierPaymentReminderSettings(supplierId, payload)}
      onSaved={() => {
        void queryClient.invalidateQueries({
          queryKey: ['account', 'suppliers', supplierId, 'payment-reminder-settings'],
        })
      }}
    />
  )
}
