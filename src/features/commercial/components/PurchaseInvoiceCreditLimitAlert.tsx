import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fetchSupplierCreditLimitStatus } from '@/features/account/account-supplier-credit-api'
import { formatCurrency } from '@/utils/helpers'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'

type Props = {
  supplierProfileId: number | null
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

export function PurchaseInvoiceCreditLimitAlert({
  supplierProfileId,
  paymentTerms,
  paymentTermOptions,
  proposedAmount,
  excludeInvoiceId,
}: Props) {
  const { t } = useTranslation()

  const creditTerms = isCreditPaymentTerm(paymentTerms, paymentTermOptions)

  const statusQuery = useQuery({
    queryKey: [
      'supplier-credit-limit-status',
      supplierProfileId,
      proposedAmount,
      excludeInvoiceId,
      paymentTerms,
    ],
    queryFn: () =>
      fetchSupplierCreditLimitStatus(supplierProfileId!, {
        proposed_amount: proposedAmount,
        exclude_invoice_id: excludeInvoiceId,
      }),
    enabled:
      creditTerms && supplierProfileId != null && supplierProfileId > 0 && proposedAmount > 0,
  })

  if (!creditTerms || !supplierProfileId) {
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
      <AlertTitle>{t('Supplier credit limit')}</AlertTitle>
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

export function usePurchaseInvoiceCreditBlocked(
  supplierProfileId: number | null,
  paymentTerms: string,
  paymentTermOptions: SetupPaymentTermOption[],
  proposedAmount: number,
  excludeInvoiceId?: number,
): boolean {
  const creditTerms = isCreditPaymentTerm(paymentTerms, paymentTermOptions)

  const statusQuery = useQuery({
    queryKey: [
      'supplier-credit-limit-status',
      'blocked',
      supplierProfileId,
      proposedAmount,
      excludeInvoiceId,
      paymentTerms,
    ],
    queryFn: () =>
      fetchSupplierCreditLimitStatus(supplierProfileId!, {
        proposed_amount: proposedAmount,
        exclude_invoice_id: excludeInvoiceId,
      }),
    enabled:
      creditTerms && supplierProfileId != null && supplierProfileId > 0 && proposedAmount > 0,
  })

  if (!creditTerms) {
    return false
  }

  return statusQuery.data?.can_post_credit_invoice === false
}
