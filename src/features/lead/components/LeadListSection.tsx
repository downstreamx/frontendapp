import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  title: string
  items: Array<Record<string, unknown>>
  labelKeys?: string[]
}

function label(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]
    if (val != null && val !== '') return String(val)
  }
  return `#${String(row.id ?? '—')}`
}

export function LeadListSection({
  title,
  items,
  labelKeys = ['name', 'title', 'subject', 'file_name', 'remark', 'message'],
}: Props) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No records found.')}</p>
        ) : (
          <ul className="divide-y text-sm">
            {items.map((item, i) => (
              <li key={String(item.id ?? i)} className="py-2">
                {label(item, labelKeys)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
