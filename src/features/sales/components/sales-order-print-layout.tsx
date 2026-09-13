import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import {
  CommercialDocumentPrintLayout,
  CommercialPrintAddress,
  CommercialPrintItemsBody,
  CommercialPrintItemsHead,
  CommercialPrintItemsRow,
  CommercialPrintItemsTable,
  CommercialPrintItemsTd,
  CommercialPrintItemsTh,
  CommercialPrintPartyCard,
  CommercialPrintTotalsBox,
} from '@/features/commercial/components/commercial-document-print-layout'
import type { SalesOrderDetail } from '../sales-order-view-types'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  proposal: SalesOrderDetail
  companySettings: AppSettings
  autoPrint?: boolean
  downloadPdf?: boolean
}

export function SalesOrderPrintLayout({
  proposal,
  companySettings,
  autoPrint = false,
  downloadPdf = false,
}: Props) {
  const { t } = useTranslation()
  const billing = proposal.customer_details?.billing_address

  return (
    <CommercialDocumentPrintLayout
      companySettings={companySettings}
      containerClassName="proposal-container"
      documentTitle={t('SALES ORDER')}
      documentNumber={proposal.proposal_number}
      autoPrint={autoPrint && !downloadPdf}
      downloadPdf={downloadPdf}
      pdfFilename={`sales-order-${proposal.proposal_number}.pdf`}
      meta={
        <>
          <p>
            {t('Date')}: {formatDate(proposal.proposal_date)}
          </p>
          {proposal.due_date ? (
            <p>
              {t('Due')}: {formatDate(proposal.due_date)}
            </p>
          ) : null}
        </>
      }
      leftParty={
        <CommercialPrintPartyCard title={t('BILL TO')}>
          <p className="font-semibold text-slate-900">{proposal.customer?.name}</p>
          {proposal.customer?.email ? <p>{proposal.customer.email}</p> : null}
          <CommercialPrintAddress address={billing} />
        </CommercialPrintPartyCard>
      }
      rightParty={
        proposal.depot ? (
          <CommercialPrintPartyCard title={t('DEPOT')} align="right">
            <p className="font-semibold text-slate-900">{proposal.depot.name}</p>
          </CommercialPrintPartyCard>
        ) : (
          <div />
        )
      }
      footer={
        <>
          <p className="font-semibold text-slate-800">
            {t('PAYMENT TERMS')}: {proposal.payment_terms || t('Net 30 Days')}
          </p>
          <p className="mt-2 text-sm text-slate-600">{t('Thank you for your business!')}</p>
        </>
      }
    >
      <CommercialPrintItemsTable>
        <CommercialPrintItemsHead>
          <CommercialPrintItemsTh>{t('ITEM')}</CommercialPrintItemsTh>
          <CommercialPrintItemsTh align="center">{t('QTY')}</CommercialPrintItemsTh>
          <CommercialPrintItemsTh align="right">{t('PRICE')}</CommercialPrintItemsTh>
          <CommercialPrintItemsTh align="right">{t('DISCOUNT')}</CommercialPrintItemsTh>
          <CommercialPrintItemsTh align="right">{t('TAX')}</CommercialPrintItemsTh>
          <CommercialPrintItemsTh align="right">{t('TOTAL')}</CommercialPrintItemsTh>
        </CommercialPrintItemsHead>
        <CommercialPrintItemsBody>
          {(proposal.items ?? []).map((item, index) => (
            <CommercialPrintItemsRow key={item.id} striped={index % 2 === 1}>
              <CommercialPrintItemsTd>
                <div className="font-semibold text-slate-900">{item.product?.name ?? '—'}</div>
                {item.product?.sku ? (
                  <div className="text-xs text-slate-500">
                    {t('SKU')}: {item.product.sku}
                  </div>
                ) : null}
              </CommercialPrintItemsTd>
              <CommercialPrintItemsTd align="center">{item.quantity}</CommercialPrintItemsTd>
              <CommercialPrintItemsTd align="right">{formatCurrency(item.unit_price)}</CommercialPrintItemsTd>
              <CommercialPrintItemsTd align="right">
                {item.discount_percentage > 0 ? (
                  <>
                    <div>{item.discount_percentage}%</div>
                    <div className="text-xs font-medium">-{formatCurrency(item.discount_amount)}</div>
                  </>
                ) : (
                  <span>0%</span>
                )}
              </CommercialPrintItemsTd>
              <CommercialPrintItemsTd align="right">
                {item.taxes && item.taxes.length > 0 ? (
                  <>
                    {item.taxes.map((tax, taxIndex) => (
                      <div key={taxIndex} className="text-xs">
                        {tax.tax_name} ({tax.tax_rate}%)
                      </div>
                    ))}
                    <div className="text-xs font-medium">{formatCurrency(item.tax_amount)}</div>
                  </>
                ) : item.tax_percentage > 0 ? (
                  <>
                    <div>{item.tax_percentage}%</div>
                    <div className="text-xs font-medium">{formatCurrency(item.tax_amount)}</div>
                  </>
                ) : (
                  <span>0%</span>
                )}
              </CommercialPrintItemsTd>
              <CommercialPrintItemsTd align="right" className="font-semibold text-slate-900">
                {formatCurrency(item.total_amount)}
              </CommercialPrintItemsTd>
            </CommercialPrintItemsRow>
          ))}
        </CommercialPrintItemsBody>
      </CommercialPrintItemsTable>

      <CommercialPrintTotalsBox>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('Subtotal')}:</span>
            <span>{formatCurrency(proposal.subtotal)}</span>
          </div>
          {proposal.discount_amount > 0 ? (
            <div className="flex justify-between">
              <span>{t('Discount')}:</span>
              <span>-{formatCurrency(proposal.discount_amount)}</span>
            </div>
          ) : null}
          {proposal.tax_amount > 0 ? (
            <div className="flex justify-between">
              <span>{t('Tax')}:</span>
              <span>{formatCurrency(proposal.tax_amount)}</span>
            </div>
          ) : null}
          <div className="mt-2 border-t border-slate-300 pt-2">
            <div className="flex justify-between text-lg font-bold text-[#1e3a5f]">
              <span>{t('TOTAL')}:</span>
              <span>{formatCurrency(proposal.total_amount)}</span>
            </div>
          </div>
        </div>
      </CommercialPrintTotalsBox>

      {proposal.notes ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p className="font-semibold text-slate-800">{t('Notes')}</p>
          <p className="mt-1 text-slate-700">{proposal.notes}</p>
        </div>
      ) : null}
    </CommercialDocumentPrintLayout>
  )
}
