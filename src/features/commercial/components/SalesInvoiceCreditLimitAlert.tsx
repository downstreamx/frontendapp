import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fetchCustomerCreditLimitStatus } from '@/features/account/account-customer-credit-api'
import { formatCurrency } from '@/utils/helpers'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'

type Props = {
  customerProfileId: number | null
  paymentTerms: string
  paymentTermOptions: SetupPaymentTermOption[]
  proposedAmount: number
  excludeInvoiceId?: number
}

function isCreditPaymentTerm(
  paymentTerms: string,
  options: SetupPaymentTermOption[],
): boolean {
  if (!paymentTerms.trim()) {
    return false
  }

  const match = options.find(
    (term) => term.name === paymentTerms || term.code === paymentTerms,
  )

  if (match?.is_credit) {
    return true
  }

  return paymentTerms.toLowerCase().includes('credit')
}

export function SalesInvoiceCreditLimitAlert({
  customerProfileId,
  paymentTerms,
  paymentTermOptions,
  proposedAmount,
  excludeInvoiceId,
}: Props) {
  const { t } = useTranslation()

  const creditTerms = isCreditPaymentTerm(paymentTerms, paymentTermOptions)

  const statusQuery = useQuery({
    queryKey: [
      'customer-credit-limit-status',
      customerProfileId,
      proposedAmount,
      excludeInvoiceId,
      paymentTerms,
    ],
    queryFn: () =>
      fetchCustomerCreditLimitStatus(customerProfileId!, {
        proposed_amount: proposedAmount,
        exclude_invoice_id: excludeInvoiceId,
      }),
    enabled: creditTerms && customerProfileId != null && customerProfileId > 0 && proposedAmount > 0,
  })

  if (!creditTerms || !customerProfileId) {
    return null
  }

  if (statusQuery.isLoading) {
    return (
      <Alert>
        <AlertTitle>{t('Credit limit check')}</AlertTitle>
        <AlertDescription>{t('Checking available credit…')}</AlertDescription>
      </Alert>
    )
  }

  if (!statusQuery.data) {
    return null
  }

  const status = statusQuery.data
  const variant = status.can_post_credit_invoice ? 'default' : 'destructive'

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('Credit limit')}</AlertTitle>
      <AlertDescription className="space-y-1">
        <p>{status.message}</p>
        <p className="text-xs">
          {t('Limit')}:{' '}
          {status.credit_limit != null ? formatCurrency(status.credit_limit) : '—'}
          {' · '}
          {t('Available')}: {formatCurrency(status.available_credit)}
          {' · '}
          {t('Invoice')}: {formatCurrency(proposedAmount)}
          {!status.can_post_credit_invoice && status.shortfall > 0 ? (
            <>
              {' · '}
              {t('Shortfall')}: {formatCurrency(status.shortfall)}
            </>
          ) : null}
        </p>
      </AlertDescription>
    </Alert>
  )
}

export function useSalesInvoiceCreditBlocked(
  customerProfileId: number | null,
  paymentTerms: string,
  paymentTermOptions: SetupPaymentTermOption[],
  proposedAmount: number,
  excludeInvoiceId?: number,
): boolean {
  const creditTerms = isCreditPaymentTerm(paymentTerms, paymentTermOptions)

  const statusQuery = useQuery({
    queryKey: [
      'customer-credit-limit-status',
      'blocked',
      customerProfileId,
      proposedAmount,
      excludeInvoiceId,
      paymentTerms,
    ],
    queryFn: () =>
      fetchCustomerCreditLimitStatus(customerProfileId!, {
        proposed_amount: proposedAmount,
        exclude_invoice_id: excludeInvoiceId,
      }),
    enabled: creditTerms && customerProfileId != null && customerProfileId > 0 && proposedAmount > 0,
  })

  if (!creditTerms) {
    return false
  }

  return statusQuery.data?.can_post_credit_invoice === false
}
