export async function downloadInvoicePdfFromElement(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default
  const options = {
    margin: 0.25,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const },
  }
  await html2pdf().set(options).from(element).save()
}
