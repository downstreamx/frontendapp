import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2, Check, Download, Eye, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { resolveMediaUrl } from '@/features/media/media-url'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatAdminCurrency } from '@/utils/helpers'
import {
  approveBankTransferPayment,
  deleteBankTransferPayment,
  listBankTransferPaymentsPaginated,
  rejectBankTransferPayment,
  type BankTransferPaymentRow,
} from '../bank-transfer-api'

type AppliedFilters = { status: string; user_name: string }

const defaultFilters: AppliedFilters = { status: '', user_name: '' }

export function BankTransferPaymentsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth, imageUrlPrefix } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'delete'
    row: BankTransferPaymentRow
  } | null>(null)
  const [viewingRequest, setViewingRequest] = useState<BankTransferPaymentRow | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1

  const canApprove = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'approve-bank-transfer-requests',
  )
  const canManage = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-bank-transfer-requests',
  )

  usePageChrome({
    pageTitle: t('Bank transfer requests'),
    breadcrumbs: [{ label: t('Subscription') }, { label: t('Bank transfer') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.order_id = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.user_name) params.user_name = appliedFilters.user_name
    return params
  }, [appliedFilters.status, appliedFilters.user_name, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['bank-transfer', 'payments', listParams],
    queryFn: () => listBankTransferPaymentsPaginated(listParams),
  })

  const actionMutation = useMutation({
    mutationFn: async (action: { type: 'approve' | 'reject' | 'delete'; id: number }) => {
      if (action.type === 'approve') return approveBankTransferPayment(action.id)
      if (action.type === 'reject') return rejectBankTransferPayment(action.id)
      await deleteBankTransferPayment(action.id)
    },
    onSuccess: (_, variables) => {
      const message =
        variables.type === 'approve'
          ? t('Bank transfer approved and plan activated.')
          : variables.type === 'reject'
            ? t('Bank transfer rejected.')
            : t('Bank transfer request deleted.')
      toast.success(message)
      setConfirmAction(null)
      void queryClient.invalidateQueries({ queryKey: ['bank-transfer', 'payments'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Action failed'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount =
    (appliedFilters.status ? 1 : 0) + (appliedFilters.user_name ? 1 : 0)
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<BankTransferPaymentRow>[] = [
    {
      key: 'order_id',
      header: t('Order number'),
      render: (_, row) => row.order_id ?? `#${row.id}`,
    },
    {
      key: 'user',
      header: t('Company'),
      render: (_, row) => row.user?.name ?? '—',
    },
    {
      key: 'plan',
      header: t('Plan'),
      render: (_, row) => row.plan?.name ?? '—',
    },
    {
      key: 'price',
      header: t('Amount'),
      render: (_, row) =>
        row.price != null
          ? formatAdminCurrency(row.price, { currencyCode: row.price_currency ?? 'USD' })
          : '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) =>
        row.status ? <FleetStatusBadge status={row.status} label={row.status} /> : '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => {
        const viewButton = (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-primary"
            onClick={() => setViewingRequest(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )

        if (row.status !== 'pending') {
          return (
            <div className="flex gap-1">
              {viewButton}
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => setConfirmAction({ type: 'delete', row })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )
        }

        return (
          <div className="flex gap-1">
            {viewButton}
            {canApprove ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600"
                  onClick={() => setConfirmAction({ type: 'approve', row })}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-orange-600"
                  onClick={() => setConfirmAction({ type: 'reject', row })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={() => setConfirmAction({ type: 'delete', row })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const confirmMessage = confirmAction
    ? confirmAction.type === 'approve'
      ? t('Approve this bank transfer and activate the company plan?')
      : confirmAction.type === 'reject'
        ? t('Reject this bank transfer request?')
        : t('Delete this bank transfer request?')
    : ''

  const viewingRequestData = useMemo(() => {
    if (!viewingRequest?.request) return null
    const raw = viewingRequest.request
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, unknown>
      } catch {
        return null
      }
    }
    return raw
  }, [viewingRequest?.request])

  const attachmentUrl = viewingRequest?.attachment
    ? resolveMediaUrl(viewingRequest.attachment, imageUrlPrefix)
    : null

  const isImageAttachment = attachmentUrl
    ? /\.(jpe?g|png|gif|webp|bmp)$/i.test(viewingRequest?.attachment ?? '')
    : false

  return (
    <>
      <ModuleListCard
        title={t('Bank transfer requests')}
        description={t('Review pending subscription payments submitted via bank transfer.')}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search by order number…'),
          showFilters,
          onToggleFilters: () => setShowFilters((v) => !v),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Company / user')}</Label>
                <Input
                  value={draftFilters.user_name}
                  onChange={(event) =>
                    setDraftFilters((f) => ({ ...f, user_name: event.target.value }))
                  }
                  placeholder={t('Search by company or user name…')}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    <SelectItem value="pending">{t('Pending')}</SelectItem>
                    <SelectItem value="approved">{t('Approved')}</SelectItem>
                    <SelectItem value="rejected">{t('Rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" size="sm" onClick={applyFilters}>
                  {t('Apply')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  {t('Clear')}
                </Button>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={
          pagination
            ? {
                ...pagination,
                onPageChange: (p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(p))
                  setSearchParams(next)
                },
              }
            : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={Building2}
            title={t('No bank transfer requests')}
            description={t('Pending requests appear when companies checkout via bank transfer.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded columns={columns} data={rows} />
        )}
      </ModuleListCard>

      <Dialog open={Boolean(viewingRequest)} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Bank transfer request details')}</DialogTitle>
            <DialogDescription>
              {t('Order number')}: {viewingRequest?.order_id ?? '—'}
            </DialogDescription>
          </DialogHeader>

          {viewingRequest ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">{t('Company')}</Label>
                  <div className="mt-1 font-medium">{viewingRequest.user?.name ?? '—'}</div>
                  {viewingRequest.user?.email ? (
                    <div className="text-sm text-muted-foreground">{viewingRequest.user.email}</div>
                  ) : null}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t('Plan')}</Label>
                  <div className="mt-1 font-medium">{viewingRequest.plan?.name ?? '—'}</div>
                  {viewingRequestData?.addon_name ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t('Feature')}: {String(viewingRequestData.addon_name)}
                    </div>
                  ) : null}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t('Amount')}</Label>
                  <div className="mt-1 font-medium">
                    {viewingRequest.price != null
                      ? formatAdminCurrency(viewingRequest.price, {
                          currencyCode: viewingRequest.price_currency ?? 'USD',
                        })
                      : '—'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t('Status')}</Label>
                  <div className="mt-1">
                    {viewingRequest.status ? (
                      <FleetStatusBadge status={viewingRequest.status} label={viewingRequest.status} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>

              {viewingRequestData?.coupon_code ? (
                <div>
                  <Label className="text-sm text-muted-foreground">{t('Coupon code')}</Label>
                  <div className="mt-1 font-medium">{String(viewingRequestData.coupon_code)}</div>
                </div>
              ) : null}

              {attachmentUrl ? (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">{t('Payment receipt')}</Label>
                  {isImageAttachment ? (
                    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={attachmentUrl}
                        alt={t('Payment receipt')}
                        className="max-h-64 rounded-md border object-contain"
                      />
                    </a>
                  ) : null}
                  <Button variant="outline" size="sm" asChild>
                    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="mr-2 h-4 w-4" />
                      {t('Download receipt')}
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {viewingRequest?.status === 'pending' && canApprove ? (
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setConfirmAction({ type: 'approve', row: viewingRequest })
                  setViewingRequest(null)
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                {t('Approve')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmAction({ type: 'reject', row: viewingRequest })
                  setViewingRequest(null)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                {t('Reject')}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'approve'
            ? t('Approve request')
            : confirmAction?.type === 'reject'
              ? t('Reject request')
              : t('Delete request')
        }
        message={confirmMessage}
        variant={confirmAction?.type === 'approve' ? 'default' : 'destructive'}
        confirmText={
          confirmAction?.type === 'approve'
            ? t('Approve')
            : confirmAction?.type === 'reject'
              ? t('Reject')
              : t('Delete')
        }
        onConfirm={() => {
          if (!confirmAction) return
          actionMutation.mutate({ type: confirmAction.type, id: confirmAction.row.id })
        }}
        loading={actionMutation.isPending}
      />
    </>
  )
}
