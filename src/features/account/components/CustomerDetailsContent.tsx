import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PartyRow } from '../account-party-api'
import { formatPartyAddressLines } from '../customer-view-utils'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'

function InfoTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

function AddressSection({ label, lines }: { label: string; lines: string[] }) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold">{label}</h3>
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  )
}

type Props = {
  customer: PartyRow
}

export function CustomerDetailsContent({ customer }: Props) {
  const { t } = useTranslation()

  const billingLines = formatPartyAddressLines(customer.billing_address)
  const shippingLines = customer.same_as_billing
    ? billingLines
    : formatPartyAddressLines(customer.shipping_address)

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-lg font-semibold">{t('Customer Information')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoTile label={t('Customer Code')}>
            <p>{customer.customer_code || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Company Name')}>
            <p>{customer.company_name}</p>
          </InfoTile>
          <InfoTile label={t('Contact Person')}>
            <p>{customer.contact_person_name || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Email')}>
            <p>{customer.contact_person_email || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Mobile')}>
            <p>{customer.contact_person_mobile || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Tax Number')}>
            <p>{customer.tax_number || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Payment Terms')}>
            <p>{customer.payment_terms || '—'}</p>
          </InfoTile>
        </div>
      </section>

      {customer.user ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold">{t('Linked User')}</h3>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <UserAvatar
              avatar={customer.user.avatar}
              name={customer.user.name}
              size="md"
              rounded="md"
              className="bg-background"
            />
            <div>
              <p className="font-medium">{customer.user.name}</p>
              {customer.user.is_disable ? (
                <p className="text-xs text-destructive">{t('User is disabled')}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {billingLines ? <AddressSection label={t('Billing Address')} lines={billingLines} /> : null}

      {shippingLines && !customer.same_as_billing ? (
        <AddressSection label={t('Shipping Address')} lines={shippingLines} />
      ) : customer.same_as_billing && billingLines ? (
        <p className="text-sm text-muted-foreground">{t('Shipping address same as billing')}</p>
      ) : null}

      {customer.notes ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold">{t('Notes')}</h3>
          <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {customer.notes}
          </p>
        </section>
      ) : null}
    </div>
  )
}
