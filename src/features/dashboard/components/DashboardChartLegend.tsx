import { PieChart } from '@/components/charts'

export type DashboardChartSlice = {
  name: string
  value: number
  color: string
  unit?: string | null
}

function formatSliceValue(value: number, unit?: string | null): string {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return unit ? `${formatted} ${unit}` : formatted
}

export function DashboardChartLegend({
  items,
  height = 200,
  showList = true,
  showSliceLabels = false,
  innerRadius = 60,
  outerRadius = 80,
}: {
  items: DashboardChartSlice[]
  height?: number
  showList?: boolean
  showSliceLabels?: boolean
  innerRadius?: number
  outerRadius?: number
}) {
  const visible = items.filter((item) => item.value > 0)
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No data.</p>
  }

  return (
    <div className="space-y-6">
      <PieChart
        data={visible}
        height={height}
        donut
        showTooltip
        showSliceLabels={showSliceLabels}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
      />
      {showList ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((item) => (
            <li key={item.name} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-base font-bold tabular-nums">
                {formatSliceValue(item.value, item.unit)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
