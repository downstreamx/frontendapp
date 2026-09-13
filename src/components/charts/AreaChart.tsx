import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_TOOLTIP_STYLE, formatChartValue, type ChartValueFormat } from './chart-formatters'

export type AreaChartSeries = {
  dataKey: string
  color: string
  name?: string
}

type AreaChartProps = {
  data: Array<Record<string, string | number>>
  dataKey?: string
  xAxisKey: string
  color?: string
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter'
  stacked?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  gradient?: boolean
  height?: number
  areas?: AreaChartSeries[]
  valueFormat?: ChartValueFormat
  gradientId?: string
}

export function AreaChart({
  data,
  dataKey = 'value',
  xAxisKey,
  color = '#3b82f6',
  type = 'monotone',
  stacked = false,
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  gradient = true,
  height = 350,
  areas = [],
  valueFormat = 'number',
  gradientId = 'dashboardAreaFill',
}: AreaChartProps) {
  const formatValue = (value: unknown) => formatChartValue(value, valueFormat)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ left: 12, right: 12 }}>
        {gradient ? (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
        ) : null}
        {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /> : null}
        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={formatValue} />
        {showTooltip ? (
          <Tooltip formatter={(value) => [formatValue(value), undefined]} contentStyle={CHART_TOOLTIP_STYLE} />
        ) : null}
        {showLegend ? <Legend /> : null}
        {areas.length > 0
          ? areas.map((area) => (
              <Area
                key={area.dataKey}
                name={area.name || area.dataKey}
                type={type}
                dataKey={area.dataKey}
                stackId={stacked ? '1' : undefined}
                stroke={area.color}
                fill={gradient ? `url(#${gradientId})` : area.color}
                fillOpacity={gradient ? 1 : 0.4}
                strokeWidth={3}
              />
            ))
          : (
              <Area
                type={type}
                dataKey={dataKey}
                stackId={stacked ? '1' : undefined}
                stroke={color}
                fill={gradient ? `url(#${gradientId})` : color}
                fillOpacity={gradient ? 1 : 0.4}
                strokeWidth={3}
              />
            )}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
