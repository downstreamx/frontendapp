import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartLine, ChartPoint } from '../api'

type Props = {
  chartData: ChartPoint[]
  chartLines: ChartLine[]
}

export function ProjectTaskChart({ chartData, chartLines }: Props) {
  const { t } = useTranslation()

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t('No chart data yet.')}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('Task stages (last 5 months)')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">{t('Month')}</th>
              {chartLines.map((line) => (
                <th key={line.dataKey} className="text-right py-2 px-2">
                  {line.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.name} className="border-b">
                <td className="py-2 pr-4 font-medium">{row.name}</td>
                {chartLines.map((line) => (
                  <td key={line.dataKey} className="text-right py-2 px-2 text-muted-foreground">
                    {Number(row[line.dataKey] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
