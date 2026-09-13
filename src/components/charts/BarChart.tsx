import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_TOOLTIP_STYLE, formatChartValue, type ChartValueFormat } from './chart-formatters'

export type BarChartSeries = {
  dataKey: string
  color: string
  name?: string
}

type BarChartProps = {
  data: Array<Record<string, string | number>>
  dataKey?: string
  xAxisKey: string
  color?: string
  horizontal?: boolean
  stacked?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  height?: number
  bars?: BarChartSeries[]
  activeIndex?: number
  negative?: boolean
  valueFormat?: ChartValueFormat
  /** Draw a line through the top of each bar (vertical charts only). */
  connectBarTops?: boolean
}

export function BarChart({
  data,
  dataKey = 'value',
  xAxisKey,
  color = '#3b82f6',
  horizontal = false,
  stacked = false,
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  height = 350,
  bars = [],
  activeIndex,
  negative = false,
  valueFormat = 'number',
  connectBarTops = false,
}: BarChartProps) {
  const formatValue = (value: unknown) => formatChartValue(value, valueFormat)
  const layout = horizontal ? { layout: 'horizontal' as const } : {}
  const resolvedBars =
    bars.length > 0 ? bars : [{ dataKey, color, name: dataKey }]
  const useComposed = connectBarTops && !horizontal
  const ChartRoot = useComposed ? ComposedChart : RechartsBarChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartRoot
        data={data}
        margin={horizontal ? { left: 80, right: 12 } : { left: 12, right: 12 }}
        {...layout}
      >
        {showGrid ? <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" /> : null}
        {horizontal ? (
          <>
            <XAxis
              type="number"
              domain={negative ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <YAxis type="category" dataKey={xAxisKey} tickLine={false} axisLine={false} width={70} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              domain={negative ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatValue}
            />
          </>
        )}
        {showTooltip ? (
          useComposed ? (
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null
                }

                const entry = payload.find(
                  (p, index, arr) => arr.findIndex((x) => x.dataKey === p.dataKey) === index,
                )
                if (!entry) {
                  return null
                }

                const displayName =
                  resolvedBars.find((b) => b.dataKey === entry.dataKey)?.name
                  ?? entry.name
                  ?? entry.dataKey

                return (
                  <div
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md"
                    style={CHART_TOOLTIP_STYLE}
                  >
                    {label != null && label !== '' ? (
                      <p className="mb-1 font-medium text-foreground">{String(label)}</p>
                    ) : null}
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{displayName}</span>
                      {': '}
                      {formatValue(entry.value)}
                    </p>
                  </div>
                )
              }}
            />
          ) : (
            <Tooltip
              formatter={(value) => [formatValue(value), undefined]}
              contentStyle={CHART_TOOLTIP_STYLE}
            />
          )
        ) : null}
        {showLegend ? (
          <Legend
            payload={
              useComposed
                ? resolvedBars.map((bar) => ({
                    value: bar.name || bar.dataKey,
                    type: 'square' as const,
                    color: bar.color,
                    id: bar.dataKey,
                  }))
                : undefined
            }
          />
        ) : null}
        {resolvedBars.map((bar) => (
          <Bar
            key={bar.dataKey}
            name={bar.name || bar.dataKey}
            dataKey={bar.dataKey}
            stackId={stacked ? '1' : undefined}
            fill={bar.color}
            radius={4}
          >
            {activeIndex !== undefined && bars.length === 0
              ? data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === activeIndex ? '#10b77f' : bar.color} />
                ))
              : null}
          </Bar>
        ))}
        {useComposed
          ? resolvedBars.map((bar) => (
              <Line
                key={`${bar.dataKey}-trend`}
                type="linear"
                dataKey={bar.dataKey}
                name=""
                stroke={bar.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: bar.color, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                legendType="none"
                isAnimationActive={false}
              />
            ))
          : null}
      </ChartRoot>
    </ResponsiveContainer>
  )
}
