import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { DataTable, type Column } from '@/components/ui/data-table'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  canUnpostJournalEntry,
  formatJournalEntryStatusLabel,
  getJournalEntryStatusBadgeClasses,
} from '../journal-entry-utils'
import {
  getJournalEntry,
  postJournalEntry,
  unpostJournalEntry,
  type JournalEntryItem,
} from '../journal-entries-api'

export function JournalEntryShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showPostConfirm, setShowPostConfirm] = useState(false)
  const [showUnpostConfirm, setShowUnpostConfirm] = useState(false)

  const entryQuery = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => getJournalEntry(Number(id)),
    enabled: Boolean(id),
  })

  const entry = entryQuery.data

  useAccountPageChrome(
    entry?.journal_number ?? t('Journal Entry'),
    t('Journal Entries'),
  )

  const postMutation = useMutation({
    mutationFn: () => postJournalEntry(Number(id)),
    onSuccess: () => {
      toast.success(t('Journal entry posted successfully.'))
      setShowPostConfirm(false)
      void queryClient.invalidateQueries({ queryKey: ['journal-entry', id] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post journal entry'))),
  })

  const unpostMutation = useMutation({
    mutationFn: () => unpostJournalEntry(Number(id)),
    onSuccess: () => {
      toast.success(t('Journal entry unposted successfully.'))
      setShowUnpostConfirm(false)
      void queryClient.invalidateQueries({ queryKey: ['journal-entry', id] })
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to unpost journal entry'))),
  })

  if (entryQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }
  if (entryQuery.error || !entry) {
    return <p className="text-sm text-destructive">{t('Journal entry not found.')}</p>
  }

  const lineColumns: Column<JournalEntryItem>[] = [
    {
      key: 'account',
      header: t('Account'),
      render: (_, row) =>
        row.account
          ? `${row.account.account_code} — ${row.account.account_name}`
          : `#${row.account_id}`,
    },
    {
      key: 'description',
      header: t('Description'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'debit_amount',
      header: t('Debit'),
      render: (_, row) =>
        Number(row.debit_amount) > 0 ? formatCurrency(Number(row.debit_amount)) : '—',
    },
    {
      key: 'credit_amount',
      header: t('Credit'),
      render: (_, row) =>
        Number(row.credit_amount) > 0 ? formatCurrency(Number(row.credit_amount)) : '—',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            {entry.journal_number ?? `${t('Journal')} #${entry.id}`}
          </h1>
          <span className={getJournalEntryStatusBadgeClasses(entry.status)}>
            {formatJournalEntryStatusLabel(entry.status, t)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {entry.status === 'draft' ? (
            <Button size="sm" onClick={() => setShowPostConfirm(true)} disabled={postMutation.isPending}>
              {t('Post')}
            </Button>
          ) : null}
          {canUnpostJournalEntry(entry) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUnpostConfirm(true)}
              disabled={unpostMutation.isPending}
            >
              {t('Unpost')}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" asChild>
            <Link to={paths.account.journalEntries}>{t('Back to list')}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">{t('Date')}:</span>{' '}
            {formatDate(entry.journal_date)}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Type')}:</span>{' '}
            <span className="capitalize">
              {(entry.entry_type ?? 'manual').replace(/_/g, ' ')}
            </span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">{t('Description')}:</span> {entry.description}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Total Debit')}:</span>{' '}
            {formatCurrency(Number(entry.total_debit ?? 0))}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Total Credit')}:</span>{' '}
            {formatCurrency(Number(entry.total_credit ?? 0))}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Lines')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable embedded data={entry.items ?? []} columns={lineColumns} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showPostConfirm}
        onOpenChange={setShowPostConfirm}
        title={t('Post Journal Entry')}
        message={t('Are you sure you want to post this journal entry? This will update account balances.')}
        confirmText={t('Post')}
        onConfirm={() => postMutation.mutate()}
        loading={postMutation.isPending}
      />

      <ConfirmationDialog
        open={showUnpostConfirm}
        onOpenChange={setShowUnpostConfirm}
        title={t('Unpost Journal Entry')}
        message={t(
          'Are you sure you want to unpost this journal entry? Account balances will be reversed.',
        )}
        confirmText={t('Unpost')}
        onConfirm={() => unpostMutation.mutate()}
        loading={unpostMutation.isPending}
      />
    </div>
  )
}
