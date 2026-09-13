import type { ReactNode } from 'react'

export type HrmDetailItem = {
  label: string
  value?: ReactNode
}

export function HrmDetailGrid({ items }: { items: HrmDetailItem[] }) {
  const visible = items.filter((item) => item.value != null && item.value !== '')
  if (visible.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <div className="text-sm font-medium">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
