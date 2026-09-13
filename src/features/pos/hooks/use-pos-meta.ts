import { useQuery } from '@tanstack/react-query'
import { fetchPosIndexMeta } from '../pos-api'
import {
  toCustomerLookupOptions,
  toProductLookupOptions,
  type LookupOption,
} from '@/features/_shared/operations-lookups'

export function usePosMeta() {
  const query = useQuery({
    queryKey: ['pos', 'index-meta'],
    queryFn: fetchPosIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const depotOptions: LookupOption[] =
    meta?.depots.map((d) => ({ id: d.id, label: d.name })) ?? []

  const customerOptions: LookupOption[] = meta?.customers
    ? toCustomerLookupOptions(meta.customers)
    : []

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

  const bankAccountOptions: LookupOption[] =
    meta?.bank_accounts?.map((b) => ({
      id: b.id,
      label: [b.account_name, b.bank_name, b.account_number].filter(Boolean).join(' · '),
    })) ?? []

  return {
    ...query,
    meta,
    depotOptions,
    customerOptions,
    productOptions,
    bankAccountOptions,
  }
}
