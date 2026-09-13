import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from 'recharts'
import { CHART_COLORS } from './chart-formatters'

type PieChartMargin = {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

type PieChartProps = {
  data: Array<{ name: string; value: number; color?: string }>
  dataKey?: string
  nameKey?: string
  height?: number
  donut?: boolean
  innerRadius?: number
  outerRadius?: number
  separatorNone?: boolean
  activeIndex?: number
  showLegend?: boolean
  showTooltip?: boolean
  /** Draw product/category names outside slices with connector lines */
  showSliceLabels?: boolean
  chartMargin?: PieChartMargin
}

function renderOutsideSliceLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
}: PieLabelRenderProps) {
  if (cx == null || cy == null || midAngle == null || outerRadius == null || !name) {
    return null
  }

  const centerX = Number(cx)
  const centerY = Number(cy)
  const angle = Number(midAngle)
  const radius = Number(outerRadius)
  const radian = Math.PI / 180
  const labelRadius = radius + 28
  const x = centerX + labelRadius * Math.cos(-angle * radian)
  const y = centerY + labelRadius * Math.sin(-angle * radian)
  const textAnchor = x > centerX ? 'start' : 'end'

  return (
    <text
      x={x}
      y={y}
      className="fill-foreground text-xs font-medium"
      textAnchor={textAnchor}
      dominantBaseline="central"
    >
      {name}
    </text>
  )
}

export function PieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 350,
  donut = false,
  innerRadius = 0,
  outerRadius = 80,
  separatorNone = false,
  activeIndex,
  showLegend = false,
  showTooltip = true,
  showSliceLabels = false,
  chartMargin,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    )
  }

  const visible = data.filter((item) => item.value > 0)
  if (visible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  const margin = chartMargin ?? (showSliceLabels ? { top: 32, right: 120, bottom: 32, left: 120 } : undefined)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart margin={margin}>
        <Pie
          data={visible}
          cx="50%"
          cy="50%"
          innerRadius={donut ? innerRadius || 60 : innerRadius}
          outerRadius={outerRadius}
          paddingAngle={separatorNone ? 0 : 5}
          dataKey={dataKey}
          nameKey={nameKey}
          label={showSliceLabels ? renderOutsideSliceLabel : false}
          labelLine={
            showSliceLabels
              ? {
                  stroke: 'hsl(var(--muted-foreground))',
                  strokeWidth: 1,
                }
              : false
          }
        >
          {visible.map((entry, index) => (
            <Cell
              key={`cell-${entry.name}-${index}`}
              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              stroke={activeIndex === index ? '#333' : 'none'}
              strokeWidth={activeIndex === index ? 2 : 0}
            />
          ))}
        </Pie>
        {showTooltip ? <Tooltip /> : null}
        {showLegend ? <Legend /> : null}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
