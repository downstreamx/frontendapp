import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import { useAppContext } from '@/contexts/app-context'
import { companyMonogram, resolveCompanyLogoUrl } from '../resolve-company-logo-url'
import { useCommercialDocumentPdf } from '../hooks/use-commercial-document-pdf'

export function commercialPrintSetting(settings: AppSettings, key: string): string {
  return settings[key] || ''
}

export function CommercialPrintAddress({
  address,
}: {
  address?: {
    name?: string
    address_line_1?: string
    city?: string
    state?: string
    zip_code?: string
  } | null
}) {
  if (!address) return null
  return (
    <>
      {address.name ? <p>{address.name}</p> : null}
      {address.address_line_1 ? <p>{address.address_line_1}</p> : null}
      {(address.city || address.state || address.zip_code) && (
        <p>
          {[address.city, address.state].filter(Boolean).join(', ')} {address.zip_code}
        </p>
      )}
    </>
  )
}

export function CommercialPrintPartyCard({
  title,
  align = 'left',
  children,
}: {
  title: string
  align?: 'left' | 'right'
  children: ReactNode
}) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <div className="mb-2 rounded-t-md bg-[#1e3a5f] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
        {title}
      </div>
      <div className="rounded-b-md border border-t-0 border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
        {children}
      </div>
    </div>
  )
}

export function CommercialPrintItemsTable({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full table-fixed text-sm">{children}</table>
    </div>
  )
}

export function CommercialPrintItemsHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-[#1e3a5f] text-xs uppercase tracking-wide text-white">{children}</tr>
    </thead>
  )
}

export function CommercialPrintItemsTh({
  children,
  align = 'left',
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  return <th className={`px-3 py-3 font-semibold ${alignClass}`}>{children}</th>
}

export function CommercialPrintItemsBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
}

export function CommercialPrintItemsRow({
  children,
  striped,
}: {
  children: ReactNode
  striped?: boolean
}) {
  return (
    <tr className={`page-break-inside-avoid ${striped ? 'bg-slate-50/80' : 'bg-white'}`}>
      {children}
    </tr>
  )
}

export function CommercialPrintItemsTd({
  children,
  align = 'left',
  className = '',
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  return <td className={`px-3 py-3 align-top ${alignClass} ${className}`}>{children}</td>
}

export function CommercialPrintTotalsBox({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex justify-end page-break-inside-avoid">
      <div className="w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 page-break-inside-avoid">
        {children}
      </div>
    </div>
  )
}

type CommercialDocumentPrintLayoutProps = {
  companySettings: AppSettings
  containerClassName: string
  documentTitle: string
  documentNumber: string
  meta: ReactNode
  leftParty: ReactNode
  rightParty: ReactNode
  children: ReactNode
  footer: ReactNode
  autoPrint?: boolean
  downloadPdf?: boolean
  pdfFilename: string
}

export function CommercialDocumentPrintLayout({
  companySettings,
  containerClassName,
  documentTitle,
  documentNumber,
  meta,
  leftParty,
  rightParty,
  children,
  footer,
  autoPrint = false,
  downloadPdf = false,
  pdfFilename,
}: CommercialDocumentPrintLayoutProps) {
  const { t } = useTranslation()
  const { imageUrlPrefix } = useAppContext()
  const companyName = commercialPrintSetting(companySettings, 'company_name') || 'YOUR COMPANY'
  const logoUrl = resolveCompanyLogoUrl(companySettings, imageUrlPrefix)
  const { isDownloading } = useCommercialDocumentPdf({
    autoPrint,
    downloadPdf,
    containerSelector: `.${containerClassName}`,
    pdfFilename,
  })

  return (
    <div className="min-h-screen bg-white text-slate-900 print:min-h-0">
      {isDownloading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#1e3a5f]" />
              <p className="text-lg font-semibold text-slate-700">{t('Generating PDF...')}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${containerClassName} mx-auto max-w-4xl bg-white p-0 shadow-sm print:shadow-none`}>
        <div className="mb-6 flex items-center justify-between rounded-t-lg bg-[#1e3a5f] px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-14 max-w-[180px] object-contain object-left"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">
                {companyMonogram(companyName)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{companyName}</h1>
              <div className="mt-1 space-y-0.5 text-xs text-slate-200">
                {commercialPrintSetting(companySettings, 'company_address') ? (
                  <p>{commercialPrintSetting(companySettings, 'company_address')}</p>
                ) : null}
                {(commercialPrintSetting(companySettings, 'company_city') ||
                  commercialPrintSetting(companySettings, 'company_state') ||
                  commercialPrintSetting(companySettings, 'company_zipcode')) && (
                  <p>
                    {commercialPrintSetting(companySettings, 'company_city')}
                    {commercialPrintSetting(companySettings, 'company_state')
                      ? `, ${commercialPrintSetting(companySettings, 'company_state')}`
                      : ''}{' '}
                    {commercialPrintSetting(companySettings, 'company_zipcode')}
                  </p>
                )}
                {commercialPrintSetting(companySettings, 'company_telephone') ? (
                  <p>
                    {t('Phone')}: {commercialPrintSetting(companySettings, 'company_telephone')}
                  </p>
                ) : null}
                {commercialPrintSetting(companySettings, 'company_email') ? (
                  <p>
                    {t('Email')}: {commercialPrintSetting(companySettings, 'company_email')}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-300">
              {documentTitle}
            </p>
            <p className="mt-1 text-2xl font-bold">#{documentNumber}</p>
            <div className="mt-2 space-y-0.5 text-sm text-slate-200">{meta}</div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>{leftParty}</div>
            <div>{rightParty}</div>
          </div>
          {children}
          <div className="mt-6 rounded-lg border border-slate-200 bg-[#f8fafc] px-6 py-4 text-center">
            {footer}
          </div>
        </div>
      </div>

      <style>{`
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: Arial, Helvetica, sans-serif;
        }
        @page {
          margin: 0.5in;
          size: A4;
        }
        .page-break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          body { background: white !important; }
          .invoice-container, .proposal-container {
            box-shadow: none !important;
            max-width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
