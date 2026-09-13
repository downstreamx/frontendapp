import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  createJournalEntry,
  getJournalEntryCreateMeta,
  type JournalEntryLineInput,
} from '../journal-entries-api'

type LineState = {
  key: string
  account_id: string
  debit: string
  credit: string
  description: string
}

function newLine(): LineState {
  return {
    key: crypto.randomUUID(),
    account_id: '',
    debit: '',
    credit: '',
    description: '',
  }
}

export function JournalEntryFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<LineState[]>([newLine(), newLine()])

  useAccountPageChrome(t('Create Journal Entry'), t('Journal Entries'))

  const metaQuery = useQuery({
    queryKey: ['journal-entries', 'create-meta'],
    queryFn: getJournalEntryCreateMeta,
  })

  const accounts = metaQuery.data?.accounts ?? []

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, l) => sum + (parseFloat(l.debit.replace(/[^\d.-]/g, '')) || 0), 0)
    const credit = lines.reduce(
      (sum, l) => sum + (parseFloat(l.credit.replace(/[^\d.-]/g, '')) || 0),
      0,
    )
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 }
  }, [lines])

  const createMutation = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: (entry) => {
      toast.success(t('The journal entry has been saved as draft.'))
      navigate(paths.account.journalEntryShow(entry.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create journal entry'))),
  })

  const updateLine = (key: string, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const buildItems = (): JournalEntryLineInput[] | null => {
    const items: JournalEntryLineInput[] = []
    for (const line of lines) {
      if (!line.account_id) continue
      const debit = parseFloat(line.debit.replace(/[^\d.-]/g, '')) || 0
      const credit = parseFloat(line.credit.replace(/[^\d.-]/g, '')) || 0
      if (debit === 0 && credit === 0) continue
      if (debit > 0 && credit > 0) {
        toast.error(t('Each line must be either debit or credit, not both.'))
        return null
      }
      items.push({
        account_id: Number(line.account_id),
        debit: debit > 0 ? debit : undefined,
        credit: credit > 0 ? credit : undefined,
        description: line.description || undefined,
      })
    }
    if (items.length < 2) {
      toast.error(t('Add at least two lines with amounts.'))
      return null
    }
    return items
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error(t('Description is required.'))
      return
    }
    if (!totals.balanced) {
      toast.error(t('Debits and credits must balance.'))
      return
    }
    const items = buildItems()
    if (!items) return
    createMutation.mutate({
      journal_date: journalDate,
      description: description.trim(),
      entry_type: 'manual',
      items,
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('Create Journal Entry')}</h1>
        <Link to={paths.account.journalEntries} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Header')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="journal_date">{t('Journal Date')}</Label>
              <Input
                id="journal_date"
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">{t('Description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Lines')}</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLines((p) => [...p, newLine()])}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('Add line')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map((line) => (
              <div key={line.key} className="grid gap-3 rounded-md border p-3 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-4">
                  <Label className="text-xs">{t('Account')}</Label>
                  <Select
                    value={line.account_id}
                    onValueChange={(v) => updateLine(line.key, { account_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select account')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.account_code} — {a.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <CurrencyInput
                    label={t('Debit')}
                    value={line.debit}
                    onChange={(value) => updateLine(line.key, { debit: value, credit: '' })}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <CurrencyInput
                    label={t('Credit')}
                    value={line.credit}
                    onChange={(value) => updateLine(line.key, { credit: value, debit: '' })}
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">{t('Line description')}</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                  />
                </div>
                <div className="flex items-end justify-end sm:col-span-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={lines.length <= 2}
                    onClick={() => setLines((p) => p.filter((l) => l.key !== line.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <p className="text-sm text-muted-foreground">
              {t('Totals')}: {t('Debit')} {formatCurrency(totals.debit)} / {t('Credit')}{' '}
              {formatCurrency(totals.credit)}
              {!totals.balanced && totals.debit + totals.credit > 0 ? (
                <span className="ml-2 text-destructive">{t('Out of balance')}</span>
              ) : null}
            </p>

            <Button type="submit" disabled={createMutation.isPending || !totals.balanced}>
              {createMutation.isPending ? t('Saving...') : t('Save draft')}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
