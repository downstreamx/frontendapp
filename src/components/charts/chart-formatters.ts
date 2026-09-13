export type ChartValueFormat = 'currency' | 'number'

export function formatChartValue(value: unknown, format: ChartValueFormat = 'number'): string {
  const num = Number(value)
  if (Number.isNaN(num)) return String(value ?? '')

  if (format === 'currency') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num)
  }

  return new Intl.NumberFormat('en-NG').format(num)
}

export const CHART_COLORS = ['#3b82f6', '#10b77f', '#f59e0b', '#ef4444', '#8b5cf6'] as const

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
} as const
