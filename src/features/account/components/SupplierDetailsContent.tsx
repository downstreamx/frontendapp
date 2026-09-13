import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PartyRow } from '../account-party-api'
import { SupplierOpeningBalanceForm } from './SupplierOpeningBalanceForm'
import { SupplierPurchaseHistoryTable } from './SupplierPurchaseHistoryTable'
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
  supplier: PartyRow
}

export function SupplierDetailsContent({ supplier }: Props) {
  const { t } = useTranslation()

  const billingLines = formatPartyAddressLines(supplier.billing_address)
  const shippingLines = supplier.same_as_billing
    ? billingLines
    : formatPartyAddressLines(supplier.shipping_address)

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-lg font-semibold">{t('Supplier Information')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoTile label={t('Supplier Code')}>
            <p>{supplier.supplier_code || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Company Name')}>
            <p>{supplier.company_name}</p>
          </InfoTile>
          <InfoTile label={t('Contact Person')}>
            <p>{supplier.contact_person_name || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Email')}>
            <p>{supplier.contact_person_email || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Mobile')}>
            <p>{supplier.contact_person_mobile || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Tax Number')}>
            <p>{supplier.tax_number || '—'}</p>
          </InfoTile>
          <InfoTile label={t('Payment Terms')}>
            <p>{supplier.payment_terms || '—'}</p>
          </InfoTile>
        </div>
      </section>

      {supplier.user ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold">{t('Linked User')}</h3>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <UserAvatar
              avatar={supplier.user.avatar}
              name={supplier.user.name}
              size="md"
              rounded="md"
              className="bg-background"
            />
            <div>
              <p className="font-medium">{supplier.user.name}</p>
              {supplier.user.is_disable ? (
                <p className="text-xs text-destructive">{t('User is disabled')}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {billingLines ? <AddressSection label={t('Billing Address')} lines={billingLines} /> : null}

      {shippingLines && !supplier.same_as_billing ? (
        <AddressSection label={t('Shipping Address')} lines={shippingLines} />
      ) : supplier.same_as_billing && billingLines ? (
        <p className="text-sm text-muted-foreground">{t('Shipping address same as billing')}</p>
      ) : null}

      {supplier.notes ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold">{t('Notes')}</h3>
          <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {supplier.notes}
          </p>
        </section>
      ) : null}

      <section>
        <h3 className="mb-4 text-lg font-semibold">{t('Opening balance')}</h3>
        <div className="rounded-lg bg-muted/50 p-4">
          <SupplierOpeningBalanceForm
            supplierId={supplier.id}
            openingBalanceDebit={Number(supplier.opening_balance_debit ?? 0)}
            openingBalanceCredit={Number(supplier.opening_balance_credit ?? 0)}
            openingBalanceAsOf={supplier.opening_balance_as_of}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold">{t('Purchase history')}</h3>
        <div className="rounded-lg bg-muted/50 p-4">
          <SupplierPurchaseHistoryTable rows={supplier.purchase_history ?? []} />
        </div>
      </section>
    </div>
  )
}
