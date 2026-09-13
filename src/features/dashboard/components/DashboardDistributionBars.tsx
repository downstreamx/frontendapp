import type { DashboardChartSlice } from '../dashboard-api'

export function DashboardDistributionBars({ items }: { items: DashboardChartSlice[] }) {
  const visible = items.filter((item) => item.value > 0)
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No data.</p>
  }

  const maxValue = Math.max(...visible.map((item) => item.value), 1)

  return (
    <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
      {visible.map((item) => {
        const width = Math.max(4, (item.value / maxValue) * 100)
        return (
          <li key={item.name} className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="font-bold tabular-nums">{item.value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${width}%`, backgroundColor: item.color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
