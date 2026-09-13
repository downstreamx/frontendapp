import { useEffect, useMemo, useState } from 'react'
import { buildBarcodeDataUrls, type PosBarcodeProduct } from '../pos-barcode-utils'

export function usePosBarcodes(products: PosBarcodeProduct[]) {
  const [barcodeDataUrls, setBarcodeDataUrls] = useState<Record<number, string>>({})

  const productKey = useMemo(
    () => products.map((p) => `${p.id}:${p.sku ?? ''}`).join('|'),
    [products],
  )

  useEffect(() => {
    if (products.length === 0) {
      setBarcodeDataUrls({})
      return
    }
    const id = window.setTimeout(() => {
      setBarcodeDataUrls(buildBarcodeDataUrls(products))
    }, 0)
    return () => window.clearTimeout(id)
    // productKey stabilizes deps; `products` is read when the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [productKey])

  return barcodeDataUrls
}
