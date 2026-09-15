import type { ReactNode } from 'react'
import { DetailFieldGrid } from '@/features/shared/components/detail-info-tile'

export type HrmDetailItem = {
  label: string
  value?: ReactNode
}

export function HrmDetailGrid({ items }: { items: HrmDetailItem[] }) {
  return <DetailFieldGrid fields={items} />
}
