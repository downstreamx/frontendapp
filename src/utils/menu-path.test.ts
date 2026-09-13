import { describe, expect, it } from 'vitest'
import { isMenuPathActive } from './menu-path'

describe('isMenuPathActive', () => {
  it('matches exact paths', () => {
    expect(isMenuPathActive('/inventory/products', '/inventory/products')).toBe(true)
  })

  it('matches nested child routes', () => {
    expect(isMenuPathActive('/inventory/products/42/edit', '/inventory/products')).toBe(true)
  })

  it('does not prefix-match account dashboard on customer routes', () => {
    expect(isMenuPathActive('/account/customers', '/account', { matchExact: true })).toBe(false)
    expect(isMenuPathActive('/account', '/account', { matchExact: true })).toBe(true)
  })

  it('still prefix-matches nested routes when matchExact is false', () => {
    expect(isMenuPathActive('/account/customers/42/edit', '/account/customers')).toBe(true)
  })
})
