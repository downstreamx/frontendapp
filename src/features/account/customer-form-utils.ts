import type { PartyPayload, PartyRow } from './account-party-api'

export type PartyAddress = {
  name: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  zip_code: string
}

export type CustomerFormState = {
  user_id: string
  company_name: string
  company_logo: string
  contact_person_name: string
  contact_person_email: string
  contact_person_mobile: string
  tax_number: string
  category_id: string
  payment_terms: string
  credit_limit: string
  billing_address: PartyAddress
  shipping_address: PartyAddress
  same_as_billing: boolean
  notes: string
}

export const emptyPartyAddress = (): PartyAddress => ({
  name: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  country: 'Nigeria',
  zip_code: '',
})

export const initialCustomerFormState = (): CustomerFormState => ({
  user_id: '',
  company_name: '',
  company_logo: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_mobile: '',
  tax_number: '',
  category_id: '',
  payment_terms: '',
  credit_limit: '',
  billing_address: emptyPartyAddress(),
  shipping_address: emptyPartyAddress(),
  same_as_billing: false,
  notes: '',
})

export function partyRowToFormState(row: PartyRow): CustomerFormState {
  return {
    user_id: row.user_id ? String(row.user_id) : '',
    company_name: row.company_name ?? '',
    company_logo: row.company_logo ?? '',
    contact_person_name: row.contact_person_name ?? '',
    contact_person_email: row.contact_person_email ?? '',
    contact_person_mobile: row.contact_person_mobile ?? '',
    tax_number: row.tax_number ?? '',
    category_id: row.customer_category_id
      ? String(row.customer_category_id)
      : row.supplier_category_id
        ? String(row.supplier_category_id)
        : '',
    payment_terms: row.payment_terms ?? '',
    credit_limit:
      row.credit_limit != null && row.credit_limit !== '' ? String(row.credit_limit) : '',
    billing_address: { ...emptyPartyAddress(), ...(row.billing_address ?? {}) },
    shipping_address: { ...emptyPartyAddress(), ...(row.shipping_address ?? {}) },
    same_as_billing: row.same_as_billing ?? false,
    notes: row.notes ?? '',
  }
}

export function buildCustomerPayload(state: CustomerFormState): PartyPayload {
  return buildPartyPayload(state, 'customer')
}

/** Update payload omits user link (legacy edit does not change linked user). */
export function buildCustomerUpdatePayload(state: CustomerFormState): PartyPayload {
  const { user_id: _userId, ...payload } = buildPartyPayload(state, 'customer')
  return payload
}

export function buildSupplierPayload(state: CustomerFormState): PartyPayload {
  return buildPartyPayload(state, 'supplier')
}

export const buildSupplierUpdatePayload = (state: CustomerFormState): PartyPayload => {
  const { user_id: _userId, ...payload } = buildPartyPayload(state, 'supplier')
  return payload
}

function buildPartyPayload(state: CustomerFormState, party: 'customer' | 'supplier'): PartyPayload {
  const billing = {
    ...state.billing_address,
    name: state.billing_address.name || state.company_name,
  }

  const payload: PartyPayload = {
    company_name: state.company_name,
    company_logo: state.company_logo || null,
    contact_person_name: state.contact_person_name,
    contact_person_email: state.contact_person_email || undefined,
    contact_person_mobile: state.contact_person_mobile || undefined,
    tax_number: state.tax_number || undefined,
    payment_terms: state.payment_terms || undefined,
    credit_limit:
      state.credit_limit.trim() !== '' ? Number(state.credit_limit) : undefined,
    notes: state.notes || undefined,
    billing_address: billing,
    same_as_billing: state.same_as_billing,
  }

  if (state.user_id) {
    payload.user_id = Number(state.user_id)
  }

  if (state.category_id) {
    if (party === 'customer') {
      payload.customer_category_id = Number(state.category_id)
    } else {
      payload.supplier_category_id = Number(state.category_id)
    }
  }

  if (!state.same_as_billing) {
    payload.shipping_address = {
      ...state.shipping_address,
      name: state.shipping_address.name || state.company_name,
    }
  }

  return payload
}

export function apiErrorsToFieldMap(errors?: Record<string, string[]>): Record<string, string> {
  if (!errors) return {}
  const map: Record<string, string> = {}
  for (const [key, messages] of Object.entries(errors)) {
    if (messages[0]) map[key] = messages[0]
  }
  return map
}
