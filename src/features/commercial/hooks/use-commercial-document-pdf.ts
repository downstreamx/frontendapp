import { useEffect, useState } from 'react'
import { downloadInvoicePdfFromElement } from '@/lib/invoice-pdf'

type Options = {
  autoPrint?: boolean
  downloadPdf?: boolean
  containerSelector: string
  pdfFilename: string
}

export function useCommercialDocumentPdf({
  autoPrint = false,
  downloadPdf = false,
  containerSelector,
  pdfFilename,
}: Options) {
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!downloadPdf) return
    let cancelled = false

    const run = async () => {
      setIsDownloading(true)
      const container = document.querySelector(containerSelector)
      if (container instanceof HTMLElement) {
        try {
          await downloadInvoicePdfFromElement(container, pdfFilename)
          if (!cancelled) {
            window.setTimeout(() => window.close(), 1000)
          }
        } catch (error) {
          console.error('PDF generation failed:', error)
        }
      }
      if (!cancelled) setIsDownloading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [containerSelector, downloadPdf, pdfFilename])

  useEffect(() => {
    if (!autoPrint || downloadPdf) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint, downloadPdf])

  return { isDownloading }
}
