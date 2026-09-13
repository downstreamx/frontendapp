export function formatPartyAddressLines(address?: Record<string, string> | null): string[] | null {
  if (!address) return null

  const lines: string[] = []
  const name = address.name?.trim()
  const line1 = (address.address_line_1 ?? address.address)?.trim()
  const line2 = address.address_line_2?.trim()
  const cityLine = [address.city, address.state, address.zip_code].filter(Boolean).join(', ').trim()
  const country = address.country?.trim()

  if (name) lines.push(name)
  if (line1) lines.push(line1)
  if (line2) lines.push(line2)
  if (cityLine) lines.push(cityLine)
  if (country) lines.push(country)

  return lines.length ? lines : null
}
