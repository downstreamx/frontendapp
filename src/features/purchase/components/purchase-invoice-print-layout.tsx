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
import type { PurchaseInvoiceDetail } from '../purchase-invoice-view-types'
import {
  purchaseInvoiceSupplierContactName,
  purchaseInvoiceSupplierPrimaryLabel,
} from '../purchase-invoice-supplier'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  invoice: PurchaseInvoiceDetail
  companySettings: AppSettings
  autoPrint?: boolean
  downloadPdf?: boolean
}

export function PurchaseInvoicePrintLayout({
  invoice,
  companySettings,
  autoPrint = false,
  downloadPdf = false,
}: Props) {
  const { t } = useTranslation()
  const billing = invoice.supplier_details?.billing_address
  const shipping = invoice.supplier_details?.shipping_address
  const supplierPrimary = purchaseInvoiceSupplierPrimaryLabel(
    invoice.supplier,
    invoice.supplier_details,
  )
  const supplierContact = purchaseInvoiceSupplierContactName(invoice.supplier)

  return (
    <CommercialDocumentPrintLayout
      companySettings={companySettings}
      containerClassName="invoice-container"
      documentTitle={t('PURCHASE INVOICE')}
      documentNumber={invoice.invoice_number}
      autoPrint={autoPrint && !downloadPdf}
      downloadPdf={downloadPdf}
      pdfFilename={`purchase-invoice-${invoice.invoice_number}.pdf`}
      meta={
        <>
          <p>
            {t('Date')}: {formatDate(invoice.invoice_date)}
          </p>
          <p>
            {t('Due')}: {formatDate(invoice.due_date)}
          </p>
        </>
      }
      leftParty={
        <CommercialPrintPartyCard title={t('VENDOR')}>
          <p className="font-semibold text-slate-900">{supplierPrimary}</p>
          {supplierContact && supplierContact !== supplierPrimary ? <p>{supplierContact}</p> : null}
          {invoice.supplier?.email ? <p>{invoice.supplier.email}</p> : null}
          <CommercialPrintAddress address={billing} />
        </CommercialPrintPartyCard>
      }
      rightParty={
        <CommercialPrintPartyCard title={t('SHIP TO')} align="right">
          {shipping ? (
            <CommercialPrintAddress address={shipping} />
          ) : (
            <p className="text-slate-500">{t('Same as supplier address')}</p>
          )}
        </CommercialPrintPartyCard>
      }
      footer={
        <>
          <p className="font-semibold text-slate-800">
            {t('PAYMENT TERMS')}: {invoice.payment_terms || t('Net 30 Days')}
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
          {(invoice.items ?? []).map((item, index) => (
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
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount_amount > 0 ? (
            <div className="flex justify-between">
              <span>{t('Discount')}:</span>
              <span>-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          ) : null}
          {invoice.tax_amount > 0 ? (
            <div className="flex justify-between">
              <span>{t('Tax')}:</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
          ) : null}
          <div className="mt-2 border-t border-slate-300 pt-2">
            <div className="flex justify-between text-lg font-bold text-[#1e3a5f]">
              <span>{t('TOTAL')}:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </CommercialPrintTotalsBox>
    </CommercialDocumentPrintLayout>
  )
}
