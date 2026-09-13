import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import type {
  AccountBalanceReport,
  CashFlowReport,
  ExpenseReport,
  GeneralLedgerReport,
  JournalEntryReport,
  OtherReportAccount,
  OtherReportKey,
} from '../other-reports-api'
import { getOtherReportDefinition } from '../other-reports-config'

type Props = {
  reportKey: OtherReportKey
  companySettings: AppSettings
  autoPrint?: boolean
  journal?: JournalEntryReport
  ledger?: GeneralLedgerReport
  selectedAccount?: OtherReportAccount | null
  accountBalance?: AccountBalanceReport
  cashFlow?: CashFlowReport
  expense?: ExpenseReport
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function OtherReportPrintLayout({
  reportKey,
  companySettings,
  autoPrint,
  journal,
  ledger,
  selectedAccount,
  accountBalance,
  cashFlow,
  expense,
}: Props) {
  const { t } = useTranslation()
  const definition = getOtherReportDefinition(reportKey)

  useEffect(() => {
    if (!autoPrint) return
    const id = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(id)
  }, [autoPrint])

  const companyName = setting(companySettings, 'company_name') || setting(companySettings, 'title_text')

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:min-h-0 print:p-4">
      <header className="mb-8 border-b pb-4 text-center">
        {companyName ? <h1 className="text-2xl font-bold">{companyName}</h1> : null}
        <h2 className="mt-2 text-xl font-semibold">{definition ? t(definition.titleKey) : ''}</h2>
        {selectedAccount ? (
          <p className="mt-1 text-sm text-gray-600">
            {selectedAccount.account_code} — {selectedAccount.account_name}
          </p>
        ) : null}
      </header>

      {reportKey === 'journal-entry' && journal ? (
        <div className="space-y-4 text-sm">
          {journal.entries.map((entry) => (
            <div key={entry.id} className="border-b pb-3">
              <p className="font-semibold">
                {entry.journal_number} · {formatDate(entry.date)} · {entry.status}
              </p>
              <table className="mt-2 w-full">
                <tbody>
                  {entry.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5">
                        {item.account_code} — {item.account_name}
                      </td>
                      <td className="py-0.5 text-right">{formatCurrency(item.debit)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(item.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}

      {(reportKey === 'general-ledger' || reportKey === 'account-statement') && ledger ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left">{t('Date')}</th>
              <th className="py-1 text-left">{t('Description')}</th>
              <th className="py-1 text-right">{t('Debit')}</th>
              <th className="py-1 text-right">{t('Credit')}</th>
              <th className="py-1 text-right">{t('Balance')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="py-1 font-medium">
                {t('Opening balance')}
              </td>
              <td className="py-1 text-right">{formatCurrency(ledger.opening_balance)}</td>
            </tr>
            {ledger.transactions.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="py-1">{formatDate(row.date)}</td>
                <td className="py-1">{row.description ?? '—'}</td>
                <td className="py-1 text-right">{formatCurrency(row.debit)}</td>
                <td className="py-1 text-right">{formatCurrency(row.credit)}</td>
                <td className="py-1 text-right">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={4} className="py-1">
                {t('Closing balance')}
              </td>
              <td className="py-1 text-right">{formatCurrency(ledger.closing_balance)}</td>
            </tr>
          </tbody>
        </table>
      ) : null}

      {reportKey === 'account-balance' && accountBalance ? (
        <div className="space-y-4 text-sm">
          {Object.entries(accountBalance.grouped).map(([type, group]) => (
            <div key={type}>
              <h3 className="font-bold">{type}</h3>
              {group.accounts.map((row) => (
                <div key={row.account_code} className="flex justify-between border-b py-0.5">
                  <span>
                    {row.account_code} — {row.account_name}
                  </span>
                  <span>{formatCurrency(row.net_balance)}</span>
                </div>
              ))}
            </div>
          ))}
          <p className="pt-2 font-bold">
            {t('Grand total')}: {formatCurrency(accountBalance.totals.net)}
          </p>
        </div>
      ) : null}

      {reportKey === 'cash-flow' && cashFlow ? (
        <div className="mx-auto max-w-md space-y-1 text-sm">
          {[
            [t('Beginning cash'), cashFlow.beginning_cash],
            [t('Operating activities'), cashFlow.operating],
            [t('Investing activities'), cashFlow.investing],
            [t('Financing activities'), cashFlow.financing],
            [t('Net cash flow'), cashFlow.net_cash_flow],
            [t('Ending cash'), cashFlow.ending_cash],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between border-b py-1">
              <span>{label}</span>
              <span>{formatCurrency(value as number)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {reportKey === 'expense-report' && expense ? (
        <table className="w-full text-sm">
          <tbody>
            {expense.expenses.map((row) => (
              <tr key={row.account_code} className="border-b">
                <td className="py-1">
                  {row.account_code} — {row.account_name}
                </td>
                <td className="py-1 text-right">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-1">{t('Total expenses')}</td>
              <td className="py-1 text-right">{formatCurrency(expense.total_expenses)}</td>
            </tr>
          </tbody>
        </table>
      ) : null}
    </div>
  )
}
