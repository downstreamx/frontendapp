import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BalanceSheetItem } from '../balance-sheets-api'
import {
  formatSubSectionLabel,
  sectionTotal,
  type GroupedBalanceSheetItems,
} from '../balance-sheet-utils'
import { formatCurrency } from '@/utils/helpers'

type Props = {
  sectionType: string
  sectionTitle: string
  sectionItems: GroupedBalanceSheetItems[string]
}

export function BalanceSheetSectionTable({ sectionType, sectionTitle, sectionItems }: Props) {
  const { t } = useTranslation()
  if (!sectionItems) return null

  let sectionGrandTotal = 0

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-bold text-gray-800">{sectionTitle}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">{t('Account')}</TableHead>
            <TableHead className="w-[20%] text-center">{t('Code')}</TableHead>
            <TableHead className="w-[20%] text-right">{t('Amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(sectionItems).map(([subSection, items]) => {
            const subTotal = sectionTotal(items)
            sectionGrandTotal += subTotal

            return (
              <Fragment key={`${sectionType}-${subSection}`}>
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold capitalize text-gray-700">
                    {formatSubSectionLabel(subSection)}
                  </TableCell>
                </TableRow>
                {items.map((item: BalanceSheetItem) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-green-600">
                      {item.account?.account_name}
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {item.account?.account_code}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-green-600">
                      {formatCurrency(Number(item.amount))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">
                    {t('Total')} {formatSubSectionLabel(subSection)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-bold tabular-nums">
                    {formatCurrency(subTotal)}
                  </TableCell>
                </TableRow>
              </Fragment>
            )
          })}
          <TableRow className="border-t-2 border-gray-400">
            <TableCell className="text-lg font-bold">
              {t('TOTAL')} {sectionTitle.toUpperCase()}
            </TableCell>
            <TableCell />
            <TableCell className="text-right text-lg font-bold tabular-nums">
              {formatCurrency(sectionGrandTotal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
