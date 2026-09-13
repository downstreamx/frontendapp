import { useQuery } from '@tanstack/react-query'
import { fetchContractMeta, fetchContractsIndexMeta } from '../contract-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useContractMeta() {
  const query = useQuery({
    queryKey: ['contract', 'create-meta'],
    queryFn: fetchContractMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const contractTypeOptions: LookupOption[] =
    meta?.contract_types.map((t) => ({ id: t.id, label: t.name })) ?? []

  const userOptions: LookupOption[] =
    meta?.users.map((u) => ({
      id: u.id,
      label: u.email ? `${u.name} (${u.email})` : u.name,
    })) ?? []

  return { ...query, meta, contractTypeOptions, userOptions }
}

export function useContractsIndexMeta() {
  const query = useQuery({
    queryKey: ['contract', 'contracts', 'index-meta'],
    queryFn: fetchContractsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const contractTypeOptions: LookupOption[] =
    meta?.contract_types.map((t) => ({ id: t.id, label: t.name })) ?? []

  const userOptions: LookupOption[] =
    meta?.users.map((u) => ({
      id: u.id,
      label: u.email ? `${u.name} (${u.email})` : u.name,
    })) ?? []

  return { ...query, meta, contractTypeOptions, userOptions }
}
