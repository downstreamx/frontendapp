/** Convert #RRGGBB to shadcn/Tailwind HSL channel string: "H S% L%". */
export function hexToHslChannels(hex: string): string {
  const normalized = hex.trim()
  if (!/^#([0-9a-fA-F]{6})$/.test(normalized)) {
    return '160 84% 39%'
  }

  const r = parseInt(normalized.slice(1, 3), 16) / 255
  const g = parseInt(normalized.slice(3, 5), 16) / 255
  const b = parseInt(normalized.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Multiply RGB channels by factor (solid — no alpha) for subtle vertical gradients */
export function darkenHex(hex: string, factor = 0.88): string {
  const normalized = hex.trim()
  if (!/^#([0-9a-fA-F]{6})$/.test(normalized)) {
    return '#0f766e'
  }
  const clamp = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
  const r = Math.round(parseInt(normalized.slice(1, 3), 16) * factor)
  const g = Math.round(parseInt(normalized.slice(3, 5), 16) * factor)
  const b = Math.round(parseInt(normalized.slice(5, 7), 16) * factor)
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`
}
