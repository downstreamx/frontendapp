/** Dial codes keyed by company_country display name. */
export const COUNTRY_DIAL_CODES: Record<string, string> = {
  Nigeria: '+234',
}

export function dialCodeForCountry(country: string): string {
  const key = country.trim() || 'Nigeria'
  return COUNTRY_DIAL_CODES[key] ?? '+234'
}

/** Strip dial code / leading zero for national-number inputs. */
export function toNationalMobile(value: string, country: string): string {
  const dialDigits = dialCodeForCountry(country).replace(/\D/g, '')
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length)
  }
  return digits.replace(/^0+/, '')
}

/** Compose E.164 from a national number + selected country. */
export function toE164Mobile(national: string, country: string): string | undefined {
  let digits = national.replace(/\D/g, '')
  if (!digits) {
    return undefined
  }

  const dial = dialCodeForCountry(country)
  const dialDigits = dial.replace(/\D/g, '')
  if (digits.startsWith(dialDigits)) {
    return `+${digits}`
  }

  digits = digits.replace(/^0+/, '')
  if (!digits) {
    return undefined
  }

  return `${dial}${digits}`
}
