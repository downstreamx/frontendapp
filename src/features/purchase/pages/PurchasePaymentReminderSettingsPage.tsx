import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { PaymentReminderScheduleCard } from '@/features/_shared/components/PaymentReminderScheduleCard'
import { usePurchasePageChrome } from '../hooks/use-purchase-page-chrome'
import {
  getPurchasePaymentReminderSettings,
  updatePurchasePaymentReminderSettings,
} from '../purchase-payment-reminder-settings-api'

export function PurchasePaymentReminderSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  usePurchasePageChrome(t('Payment reminder schedule'), t('Procurement system setup'))

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-procurement-payment-terms',
  )

  const settingsQuery = useQuery({
    queryKey: ['procurement', 'payment-reminder-settings'],
    queryFn: getPurchasePaymentReminderSettings,
  })

  return (
    <PaymentReminderScheduleCard
      companyMode
      title={t('Purchase invoice payment reminders')}
      description={t(
        'Configure when open purchase invoices with a balance trigger payment reminder emails to your company.',
      )}
      settings={settingsQuery.data}
      isLoading={settingsQuery.isLoading}
      canEdit={canEdit}
      onSave={updatePurchasePaymentReminderSettings}
      onSaved={() => {
        void queryClient.invalidateQueries({ queryKey: ['procurement', 'payment-reminder-settings'] })
      }}
    />
  )
}
