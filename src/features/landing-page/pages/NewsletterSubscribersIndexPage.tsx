import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { SearchInput } from '@/components/ui/search-input'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { hasPermission } from '@/lib/permissions'
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
  exportNewsletterSubscribers,
  type NewsletterSubscriberRow,
} from '../newsletter-subscribers-api'

export function NewsletterSubscribersIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [emailFilter, setEmailFilter] = useState(searchParams.get('email') ?? '')
  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscriberRow | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const perPage = searchParams.get('per_page') ?? '15'
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canDelete = hasPermission(auth, 'delete-newsletter-subscribers')
  const canExport = hasPermission(auth, 'export-newsletter-subscribers')

  usePageChrome({
    pageTitle: t('Manage Newsletter Subscribers'),
    breadcrumbs: [{ label: t('CMS') }, { label: t('Newsletter Subscribers') }],
    actions: canExport ? (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const params: Record<string, string> = {}
          if (emailFilter.trim()) params.email = emailFilter.trim()
          void exportNewsletterSubscribers(params)
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        {t('Export')}
      </Button>
    ) : undefined,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: perPage,
      page: String(page),
    }
    if (emailFilter.trim()) params.email = emailFilter.trim()
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [emailFilter, page, perPage, sortDirection, sortField])

  const { data, isLoading, error } = useQuery({
    queryKey: ['landing-page', 'newsletter-subscribers', listParams],
    queryFn: () => listNewsletterSubscribers(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNewsletterSubscriber(id),
    onSuccess: () => {
      toast.success(t('The newsletter subscriber has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['landing-page', 'newsletter-subscribers'] })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to delete subscriber'))),
  })

  const applySearch = () => {
    const next = new URLSearchParams(searchParams)
    if (emailFilter.trim()) next.set('email', emailFilter.trim())
    else next.delete('email')
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    setSearchParams(next)
  }

  const columns: Column<NewsletterSubscriberRow>[] = [
    {
      key: 'email',
      header: t('Email'),
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: t('IP Address'),
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-muted-foreground">
          {value ? String(value) : '—'}
        </span>
      ),
    },
    {
      key: 'details',
      header: t('Location & Device'),
      render: (_v, row) => (
        <div className="text-sm space-y-0.5">
          <div>
            {row.city || row.country
              ? [row.city, row.country].filter(Boolean).join(', ')
              : t('Unknown')}
          </div>
          {(row.browser || row.os) && (
            <div className="text-muted-foreground">
              {[row.browser, row.os].filter(Boolean).join(' · ')}
            </div>
          )}
          {row.device && (
            <div className="text-muted-foreground capitalize">{row.device}</div>
          )}
        </div>
      ),
    },
    {
      key: 'subscribed_at',
      header: t('Subscribed At'),
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? formatDate(String(value)) : '—'}
        </span>
      ),
    },
    ...(canDelete
      ? [
          {
            key: 'actions',
            header: t('Actions'),
            render: (_v: unknown, row: NewsletterSubscriberRow) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          } as Column<NewsletterSubscriberRow>,
        ]
      : []),
  ]

  const rows = data?.data ?? []

  return (
    <>
      <ModuleListCard title={t('Newsletter Subscribers')} isLoading={isLoading} error={!!error}>
        <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput
              value={emailFilter}
              onChange={setEmailFilter}
              onSearch={applySearch}
              placeholder={t('Search subscribers...')}
            />
          </div>
          <PerPageSelector
            value={perPage}
            onChange={(value) => {
              const next = new URLSearchParams(searchParams)
              next.set('per_page', value)
              next.set('page', '1')
              setSearchParams(next)
            }}
          />
        </div>
        <DataTable
          data={rows}
          columns={columns}
          onSort={handleSort}
          sortKey={sortField}
          sortDirection={sortDirection}
          className="rounded-none border-0 shadow-none"
          emptyState={
            <NoRecordsFound
              icon={Mail}
              title={t('No newsletter subscribers found')}
              description={t('No subscribers have signed up yet.')}
              hasFilters={Boolean(emailFilter.trim())}
              onClearFilters={() => {
                setEmailFilter('')
                const next = new URLSearchParams(searchParams)
                next.delete('email')
                next.set('page', '1')
                setSearchParams(next)
              }}
              className="h-auto py-8"
            />
          }
        />
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-muted-foreground">
            <span>
              {t('Showing {{from}}–{{to}} of {{total}}', {
                from: data.from ?? 0,
                to: data.to ?? 0,
                total: data.total,
              })}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page - 1))
                  setSearchParams(next)
                }}
              >
                {t('Previous')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= data.last_page}
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page + 1))
                  setSearchParams(next)
                }}
              >
                {t('Next')}
              </Button>
            </div>
          </div>
        )}
      </ModuleListCard>

      <ConfirmationDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Newsletter Subscriber')}
        message={t('Are you sure you want to delete this subscriber?')}
        confirmText={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  )
}
