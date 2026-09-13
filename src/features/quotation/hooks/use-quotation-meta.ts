import { useQuery } from '@tanstack/react-query'
import { fetchQuotationsIndexMeta } from '../quotations-api'
import {
  toCustomerLookupOptions,
  toProductLookupOptions,
  type LookupOption,
} from '@/features/_shared/operations-lookups'

export function useQuotationMeta() {
  const query = useQuery({
    queryKey: ['quotation', 'index-meta'],
    queryFn: fetchQuotationsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const customerOptions: LookupOption[] = meta?.customers
    ? toCustomerLookupOptions(meta.customers)
    : []

  const depotOptions: LookupOption[] =
    meta?.depots.map((d) => ({ id: d.id, label: d.name })) ?? []

  const productOptions: LookupOption[] = meta?.products
    ? toProductLookupOptions(
        meta.products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          image: p.image,
        })),
      )
    : []

  return {
    ...query,
    meta,
    customerOptions,
    depotOptions,
    productOptions,
  }
}
