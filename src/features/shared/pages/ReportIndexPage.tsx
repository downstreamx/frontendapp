import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type Props = {
  title: string
  apiEndpoint: string
}

type TrialBalanceData = {
  accounts: Array<{ account_code: string; account_name: string; debit: number; credit: number }>
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

type LedgerRow = {
  journal_date: string
  account_code: string
  account_name: string
  description?: string
  debit_amount: string
  credit_amount: string
}

type ProfitLossAccount = {
  account_code: string
  account_name: string
  balance: number
}

type ProfitLossData = {
  revenue: ProfitLossAccount[]
  expenses: ProfitLossAccount[]
  total_revenue: number
  total_expenses: number
  net_profit: number
}

function extractPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const wrapped = data as { data?: unknown }
  return wrapped.data ?? data
}

function ReportAccountTable({
  rows,
  emptyLabel,
}: {
  rows: ProfitLossAccount[]
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="p-2">Code</th>
            <th className="p-2">Account</th>
            <th className="p-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.account_code} className="border-b">
              <td className="p-2 font-mono">{row.account_code}</td>
              <td className="p-2">{row.account_name}</td>
              <td className="p-2 text-right">{row.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportIndexPage({ title, apiEndpoint }: Props) {
  const [params, setParams] = useSearchParams()
  const fromDate = params.get('from_date') ?? params.get('from') ?? ''
  const toDate = params.get('to_date') ?? params.get('to') ?? ''

  const isTrialBalance = apiEndpoint.includes('trial-balance')
  const isLedger = apiEndpoint.includes('ledger-summary')
  const isProfitLoss = apiEndpoint.includes('profit-loss')

  const { data, isLoading, refetch, isFetched } = useQuery({
    queryKey: ['report', apiEndpoint, fromDate, toDate],
    queryFn: async () => {
      const { data: res } = await api.get(apiEndpoint, {
        params: { from_date: fromDate, to_date: toDate },
      })
      return extractPayload(res)
    },
    enabled: Boolean(fromDate && toDate),
  })

  const trialBalance = isTrialBalance ? (data as TrialBalanceData | undefined) : undefined
  const profitLoss = isProfitLoss ? (data as ProfitLossData | undefined) : undefined
  const ledgerRows = isLedger
    ? ((data as { data?: LedgerRow[] })?.data ?? (Array.isArray(data) ? data : []))
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Select a date range and run the report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="from_date">From</Label>
            <Input
              id="from_date"
              type="date"
              value={fromDate}
              onChange={(e) =>
                setParams((p) => {
                  p.set('from_date', e.target.value)
                  p.delete('from')
                  return p
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to_date">To</Label>
            <Input
              id="to_date"
              type="date"
              value={toDate}
              onChange={(e) =>
                setParams((p) => {
                  p.set('to_date', e.target.value)
                  p.delete('to')
                  return p
                })
              }
            />
          </div>
          <Button type="button" onClick={() => refetch()} disabled={!fromDate || !toDate}>
            Run report
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {trialBalance && isFetched && (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2">Code</th>
                  <th className="p-2">Account</th>
                  <th className="p-2 text-right">Debit</th>
                  <th className="p-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.accounts.map((row) => (
                  <tr key={row.account_code} className="border-b">
                    <td className="p-2 font-mono">{row.account_code}</td>
                    <td className="p-2">{row.account_name}</td>
                    <td className="p-2 text-right">{row.debit.toFixed(2)}</td>
                    <td className="p-2 text-right">{row.credit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="p-2" colSpan={2}>
                    Totals {trialBalance.is_balanced ? '(balanced)' : '(out of balance)'}
                  </td>
                  <td className="p-2 text-right">{trialBalance.total_debit.toFixed(2)}</td>
                  <td className="p-2 text-right">{trialBalance.total_credit.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {profitLoss && isFetched && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium">Revenue</h3>
              <ReportAccountTable rows={profitLoss.revenue} emptyLabel="No revenue accounts in range." />
              <p className="mt-2 text-right text-sm font-medium">
                Total revenue: {profitLoss.total_revenue.toFixed(2)}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Expenses</h3>
              <ReportAccountTable rows={profitLoss.expenses} emptyLabel="No expense accounts in range." />
              <p className="mt-2 text-right text-sm font-medium">
                Total expenses: {profitLoss.total_expenses.toFixed(2)}
              </p>
            </div>
            <p className="text-right text-base font-semibold">
              Net profit: {profitLoss.net_profit.toFixed(2)}
            </p>
          </div>
        )}

        {isLedger && isFetched && (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Account</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Debit</th>
                  <th className="p-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{row.journal_date}</td>
                    <td className="p-2">
                      {row.account_code} {row.account_name}
                    </td>
                    <td className="p-2">{row.description ?? '—'}</td>
                    <td className="p-2 text-right">{row.debit_amount}</td>
                    <td className="p-2 text-right">{row.credit_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && isFetched && !isTrialBalance && !isLedger && !isProfitLoss && (
          <pre className="text-xs rounded-md bg-muted p-3 overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
