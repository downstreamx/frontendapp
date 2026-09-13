import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createSupportTicket,
  fetchSupportTicketsIndexMeta,
  listSupportTicketsPaginated,
  type SupportTicketListItem,
} from '../support-api'
import { useSupportMeta } from '../hooks/use-support-meta'
import {
  emptySupportTicketForm,
  SupportTicketFormFields,
  type SupportTicketFormState,
} from '../components/SupportTicketFormFields'

type AppliedFilters = {
  status: string
  category: string
}

const defaultFilters: AppliedFilters = { status: '', category: '' }

export function SupportTicketsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<SupportTicketFormState>(emptySupportTicketForm)

  const { categoryOptions, isLoading: metaLoading } = useSupportMeta()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Support tickets'),
    breadcrumbs: [{ label: t('Support') }, { label: t('Tickets') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.category) params.category = appliedFilters.category
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['support-ticket', 'tickets', listParams],
    queryFn: () => listSupportTicketsPaginated(listParams),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['support-ticket', 'tickets', 'index-meta'],
    queryFn: fetchSupportTicketsIndexMeta,
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const saveMutation = useMutation({
    mutationFn: () =>
      createSupportTicket({
        subject: form.subject,
        description: form.description,
        category: form.categoryId ? Number(form.categoryId) : undefined,
      }),
    onSuccess: (row) => {
      toast.success(t('Ticket created'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'tickets'] })
      setDialogOpen(false)
      setForm(emptySupportTicketForm())
      navigate(paths.support.ticketShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create ticket'))),
  })

  const openCreate = () => {
    setForm(emptySupportTicketForm())
    setDialogOpen(true)
  }

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      return next
    })
  }

  const columns: Column<SupportTicketListItem>[] = [
    {
      key: 'subject',
      header: t('Subject'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.support.ticketShow(row.id)} className="text-primary hover:underline">
          {row.subject}
        </Link>
      ),
    },
    {
      key: 'ticket_id',
      header: t('Ticket ID'),
      render: (_, row) => row.ticket_id ?? '—',
    },
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.tcategory?.name ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <FleetStatusBadge status={row.status} />,
    },
  ]

  return (
    <>
    <ModuleListCard
      title={t('Support tickets')}
      description={t('Create and track customer support requests.')}
      canCreate
      onCreateClick={openCreate}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search tickets...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  {(indexMeta?.statuses ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Category')}</Label>
              <Select
                value={draftFilters.category || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, category: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All categories')}</SelectItem>
                  {(indexMeta?.categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : undefined,
      }}
      pagination={pagination}
      onPageChange={(p) =>
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('page', String(p))
          return next
        })
      }
    >
      {rows.length === 0 && !isLoading ? (
        <NoRecordsFound
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onCreateClick={openCreate}
        />
      ) : (
        <DataTable columns={columns} data={rows} sortField={sortField} sortDirection={sortDirection} onSort={setSort} />
      )}
    </ModuleListCard>

    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setForm(emptySupportTicketForm())
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Create ticket')}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <SupportTicketFormFields
            form={form}
            onChange={setForm}
            categoryOptions={categoryOptions}
            metaLoading={metaLoading}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || metaLoading}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
