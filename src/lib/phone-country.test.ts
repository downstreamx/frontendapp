import { describe, expect, it } from 'vitest'
import { dialCodeForCountry, toE164Mobile, toNationalMobile } from '@/lib/phone-country'

describe('phone-country', () => {
  it('uses +234 for Nigeria', () => {
    expect(dialCodeForCountry('Nigeria')).toBe('+234')
    expect(dialCodeForCountry('')).toBe('+234')
  })

  it('strips dial code and leading zero for national display', () => {
    expect(toNationalMobile('+2348012345678', 'Nigeria')).toBe('8012345678')
    expect(toNationalMobile('08012345678', 'Nigeria')).toBe('8012345678')
    expect(toNationalMobile('2348012345678', 'Nigeria')).toBe('8012345678')
  })

  it('composes E.164 from national numbers', () => {
    expect(toE164Mobile('8012345678', 'Nigeria')).toBe('+2348012345678')
    expect(toE164Mobile('08012345678', 'Nigeria')).toBe('+2348012345678')
    expect(toE164Mobile('+2348012345678', 'Nigeria')).toBe('+2348012345678')
    expect(toE164Mobile('', 'Nigeria')).toBeUndefined()
  })
})
