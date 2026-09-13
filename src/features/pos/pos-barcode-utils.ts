import JsBarcode from 'jsbarcode'

export type PosBarcodeProduct = {
  id: number
  name: string
  sku?: string
  sale_price?: number
}

export function posBarcodeValue(product: PosBarcodeProduct): string {
  return product.sku?.trim() || `ID-${product.id}`
}

export function generateBarcodeDataUrl(value: string): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 150
    JsBarcode(canvas, value, {
      format: 'CODE128',
      width: 4,
      height: 80,
      displayValue: false,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return canvas.toDataURL('image/png', 1.0)
  } catch {
    return null
  }
}

export function buildBarcodeDataUrls(products: PosBarcodeProduct[]): Record<number, string> {
  const urls: Record<number, string> = {}
  for (const product of products) {
    const dataUrl = generateBarcodeDataUrl(posBarcodeValue(product))
    if (dataUrl) urls[product.id] = dataUrl
  }
  return urls
}
