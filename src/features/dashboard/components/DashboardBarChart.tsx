import { cn } from '@/lib/utils'
import { AreaChart, BarChart, LineChart, type ChartValueFormat } from '@/components/charts'

export type DashboardBarSeries = {
  dataKey: string
  color: string
  name: string
}

export type DashboardChartType = 'line' | 'bar' | 'area'

export function DashboardBarChart({
  data,
  series,
  xAxisKey,
  className,
  height = 300,
  chartType = 'line',
  valueFormat = 'number',
  showLegend,
  connectBarTops = false,
}: {
  data: Array<Record<string, string | number>>
  series: DashboardBarSeries[]
  xAxisKey: string
  className?: string
  height?: number
  chartType?: DashboardChartType
  valueFormat?: ChartValueFormat
  showLegend?: boolean
  connectBarTops?: boolean
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No chart data.</p>
  }

  const legend = showLegend ?? series.length > 1
  const lines = series.map((s) => ({ dataKey: s.dataKey, color: s.color, name: s.name }))
  const bars = series.map((s) => ({ dataKey: s.dataKey, color: s.color, name: s.name }))
  const primary = series[0]

  return (
    <div className={cn('w-full', className)}>
      {chartType === 'area' && primary ? (
        <AreaChart
          data={data}
          xAxisKey={xAxisKey}
          dataKey={primary.dataKey}
          color={primary.color}
          height={height}
          showLegend={legend}
          showGrid
          showTooltip
          gradient
          areas={series.length > 1 ? lines : undefined}
          valueFormat={valueFormat}
          gradientId={`area-${primary.dataKey}`}
        />
      ) : null}

      {chartType === 'bar' ? (
        <BarChart
          data={data}
          xAxisKey={xAxisKey}
          dataKey={primary?.dataKey}
          color={primary?.color}
          height={height}
          showLegend={legend}
          showGrid
          showTooltip
          bars={series.length > 1 ? bars : undefined}
          valueFormat={valueFormat}
          connectBarTops={connectBarTops}
        />
      ) : null}

      {chartType === 'line' ? (
        <LineChart
          data={data}
          xAxisKey={xAxisKey}
          dataKey={primary?.dataKey}
          color={primary?.color}
          height={height}
          showLegend={legend}
          showGrid
          showTooltip
          lines={series.length > 0 ? lines : undefined}
          valueFormat={valueFormat}
        />
      ) : null}
    </div>
  )
}
