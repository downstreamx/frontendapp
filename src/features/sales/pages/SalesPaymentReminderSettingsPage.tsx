import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { queryKeys } from '@/lib/query-keys'
import { PaymentReminderScheduleCard } from '@/features/_shared/components/PaymentReminderScheduleCard'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'
import {
  getSalesPaymentReminderSettings,
  updateSalesPaymentReminderSettings,
} from '../sales-payment-reminder-settings-api'

export function SalesPaymentReminderSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  useSalesPageChrome(t('Payment reminder schedule'), t('Sales system setup'))

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-sales-payment-terms',
  )

  const settingsQuery = useQuery({
    queryKey: queryKeys.sales.paymentReminderSettings(),
    queryFn: getSalesPaymentReminderSettings,
  })

  return (
    <PaymentReminderScheduleCard
      companyMode
      title={t('Sales invoice payment reminders')}
      description={t(
        'Configure when open sales invoices with a balance are emailed to customers before and on the due date.',
      )}
      settings={settingsQuery.data}
      isLoading={settingsQuery.isLoading}
      canEdit={canEdit}
      onSave={updateSalesPaymentReminderSettings}
      onSaved={() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sales.paymentReminderSettings() })
      }}
    />
  )
}
