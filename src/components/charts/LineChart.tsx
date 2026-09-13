import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatChartValue, type ChartValueFormat } from './chart-formatters'

export type LineChartSeries = {
  dataKey: string
  color: string
  name?: string
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter'
}

type LineChartProps = {
  data: Array<Record<string, string | number>>
  dataKey?: string
  xAxisKey: string
  color?: string
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter'
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  showDots?: boolean
  height?: number
  lines?: LineChartSeries[]
  strokeWidth?: number
  valueFormat?: ChartValueFormat
}

export function LineChart({
  data,
  dataKey = 'value',
  xAxisKey,
  color = '#3b82f6',
  type = 'monotone',
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  showDots = true,
  height = 350,
  lines = [],
  strokeWidth = 2,
  valueFormat = 'number',
}: LineChartProps) {
  const formatValue = (value: unknown) => formatChartValue(value, valueFormat)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ left: valueFormat === 'currency' ? 80 : 12, right: 20 }}>
        {showGrid ? <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" /> : null}
        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatValue} />
        {showTooltip ? (
          <Tooltip
            formatter={(value) => [formatValue(value), undefined]}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
        ) : null}
        {showLegend ? <Legend /> : null}
        {lines.length > 0
          ? lines.map((line) => (
              <Line
                key={line.dataKey}
                name={line.name || line.dataKey}
                type={line.type || type}
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={strokeWidth}
                dot={showDots}
              />
            ))
          : (
              <Line
                type={type}
                dataKey={dataKey}
                stroke={color}
                strokeWidth={strokeWidth}
                dot={showDots}
              />
            )}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
