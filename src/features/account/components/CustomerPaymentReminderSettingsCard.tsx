import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { PaymentReminderScheduleCard } from '@/features/_shared/components/PaymentReminderScheduleCard'
import { commercialInvoiceGoldenPanelClass } from '@/features/commercial/commercial-page-styles'
import {
  getCustomerPaymentReminderSettings,
  updateCustomerPaymentReminderSettings,
} from '../customer-payment-reminder-settings-api'

type Props = {
  customerId: number
}

export function CustomerPaymentReminderSettingsCard({ customerId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-customers')

  const settingsQuery = useQuery({
    queryKey: ['account', 'customers', customerId, 'payment-reminder-settings'],
    queryFn: () => getCustomerPaymentReminderSettings(customerId),
  })

  return (
    <PaymentReminderScheduleCard
      className={commercialInvoiceGoldenPanelClass}
      title={t('Payment reminders')}
      description={t(
        'Schedule reminder emails for this customer’s open sales invoices when company-wide reminders are disabled.',
      )}
      partyHintWhenCompanyOff={t(
        'Company-wide payment reminders are off. This customer uses the schedule below when reminders are enabled.',
      )}
      settings={settingsQuery.data}
      isLoading={settingsQuery.isLoading}
      canEdit={canEdit}
      onSave={(payload) => updateCustomerPaymentReminderSettings(customerId, payload)}
      onSaved={() => {
        void queryClient.invalidateQueries({
          queryKey: ['account', 'customers', customerId, 'payment-reminder-settings'],
        })
      }}
    />
  )
}
