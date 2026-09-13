import type { FleetProviderRow } from './fleet-api'

export type FleetProviderFormState = {
  name: string
  avatar: string
  tax_id: string
  provider_type_id: string
  contact_person_name: string
  contact_email: string
  contact_phone: string
  contact_address: string
  payment_terms: string
  contract_start_date: string
  contract_end_date: string
  rating: string
  description: string
  status: string
  is_active: boolean
}

export const initialFleetProviderFormState: FleetProviderFormState = {
  name: '',
  avatar: '',
  tax_id: '',
  provider_type_id: '',
  contact_person_name: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  payment_terms: '',
  contract_start_date: '',
  contract_end_date: '',
  rating: '',
  description: '',
  status: 'active',
  is_active: true,
}

export function providerToFormState(provider: FleetProviderRow & Record<string, unknown>): FleetProviderFormState {
  return {
    name: provider.name ?? '',
    avatar: (provider.avatar as string) ?? '',
    tax_id: (provider.tax_id as string) ?? '',
    provider_type_id: provider.provider_type_id ? String(provider.provider_type_id) : '',
    contact_person_name: provider.contact_person_name ?? '',
    contact_email: provider.contact_email ?? '',
    contact_phone: provider.contact_phone ?? '',
    contact_address: (provider.contact_address as string) ?? '',
    payment_terms: (provider.payment_terms as string) ?? '',
    contract_start_date: (provider.contract_start_date as string)?.slice(0, 10) ?? '',
    contract_end_date: (provider.contract_end_date as string)?.slice(0, 10) ?? '',
    rating: provider.rating != null ? String(provider.rating) : '',
    description: provider.description ?? '',
    status: provider.status ?? 'active',
    is_active: provider.is_active ?? true,
  }
}

export function formStateToProviderPayload(
  form: FleetProviderFormState,
  includeType: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name,
    avatar: form.avatar || undefined,
    tax_id: form.tax_id || undefined,
    contact_person_name: form.contact_person_name || undefined,
    contact_email: form.contact_email || undefined,
    contact_phone: form.contact_phone || undefined,
    contact_address: form.contact_address || undefined,
    payment_terms: form.payment_terms || undefined,
    contract_start_date: form.contract_start_date || undefined,
    contract_end_date: form.contract_end_date || undefined,
    rating: form.rating ? Number(form.rating) : undefined,
    description: form.description || undefined,
    status: form.status,
    is_active: form.is_active,
  }
  if (includeType && form.provider_type_id) {
    payload.provider_type_id = Number(form.provider_type_id)
  }
  return payload
}
