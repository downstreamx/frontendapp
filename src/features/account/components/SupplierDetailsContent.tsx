import { useTranslation } from 'react-i18next'
import type { PartyRow } from '../account-party-api'
import { SupplierOpeningBalanceForm } from './SupplierOpeningBalanceForm'
import { SupplierPurchaseHistoryTable } from './SupplierPurchaseHistoryTable'
import { formatPartyAddressLines } from '../customer-view-utils'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import {
  DetailInfoTile,
  DetailSectionHeading,
  detailMutedBlockClass,
} from '@/features/shared/components/detail-info-tile'

function AddressSection({ label, lines }: { label: string; lines: string[] }) {
  return (
    <section>
      <DetailSectionHeading>{label}</DetailSectionHeading>
      <div className={detailMutedBlockClass}>
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
        <DetailSectionHeading>{t('Supplier Information')}</DetailSectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailInfoTile label={t('Supplier Code')}>
            <p>{supplier.supplier_code || '—'}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Company Name')}>
            <p>{supplier.company_name}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Contact Person')}>
            <p>{supplier.contact_person_name || '—'}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Email')}>
            <p>{supplier.contact_person_email || '—'}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Mobile')}>
            <p>{supplier.contact_person_mobile || '—'}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Tax Number')}>
            <p>{supplier.tax_number || '—'}</p>
          </DetailInfoTile>
          <DetailInfoTile label={t('Payment Terms')}>
            <p>{supplier.payment_terms || '—'}</p>
          </DetailInfoTile>
        </div>
      </section>

      {supplier.user ? (
        <section>
          <DetailSectionHeading>{t('Linked User')}</DetailSectionHeading>
          <div className={`flex items-center gap-3 ${detailMutedBlockClass}`}>
            <UserAvatar
              avatar={supplier.user.avatar}
              name={supplier.user.name}
              size="md"
              rounded="md"
              className="bg-background"
            />
            <div>
              <p className="font-medium text-foreground">{supplier.user.name}</p>
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
          <DetailSectionHeading>{t('Notes')}</DetailSectionHeading>
          <p className={`${detailMutedBlockClass} whitespace-pre-wrap`}>{supplier.notes}</p>
        </section>
      ) : null}

      <section>
        <DetailSectionHeading>{t('Opening balance')}</DetailSectionHeading>
        <div className={detailMutedBlockClass}>
          <SupplierOpeningBalanceForm
            supplierId={supplier.id}
            openingBalanceDebit={Number(supplier.opening_balance_debit ?? 0)}
            openingBalanceCredit={Number(supplier.opening_balance_credit ?? 0)}
            openingBalanceAsOf={supplier.opening_balance_as_of}
          />
        </div>
      </section>

      <section>
        <DetailSectionHeading>{t('Purchase history')}</DetailSectionHeading>
        <div className={detailMutedBlockClass}>
          <SupplierPurchaseHistoryTable rows={supplier.purchase_history ?? []} />
        </div>
      </section>
    </div>
  )
}
