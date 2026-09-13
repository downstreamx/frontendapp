import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Dialog,
  DialogContent,
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  createJobPosting,
  fetchJobPostingsIndexMeta,
  listJobPostingsPaginated,
  type JobPostingListItem,
} from '../recruitment-api'

export function JobPostingsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Job postings'),
    breadcrumbs: [{ label: t('Recruitment') }, { label: t('Job postings') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedStatus) params.status = appliedStatus
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedStatus, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'job-postings', listParams],
    queryFn: () => listJobPostingsPaginated(listParams),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['recruitment', 'job-postings', 'index-meta'],
    queryFn: fetchJobPostingsIndexMeta,
  })

  const createMutation = useMutation({
    mutationFn: createJobPosting,
    onSuccess: () => {
      toast.success(t('Job posting created'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'job-postings'] })
      setCreateOpen(false)
      setTitle('')
      setDescription('')
      setDeadline('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create job posting'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const hasFilters = Boolean(toolbar.search) || Boolean(appliedStatus)

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedStatus(statusFilter)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setStatusFilter('')
    setAppliedStatus('')
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

  const columns: Column<JobPostingListItem>[] = [
    {
      key: 'title',
      header: t('Title'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.recruitment.jobPostingShow(row.id)} className="text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'application_deadline',
      header: t('Deadline'),
      sortable: true,
      render: (_, row) =>
        row.application_deadline ? formatDate(row.application_deadline) : '—',
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
        title={t('Job postings')}
        description={t('Publish and manage open roles for candidates.')}
        canCreate
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search job postings...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount: appliedStatus ? 1 : 0,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="max-w-xs space-y-1">
              <Label>{t('Status')}</Label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
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
          <NoRecordsFound hasFilters={hasFilters} onClearFilters={clearFilters} onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <DataTable columns={columns} data={rows} sortField={sortField} sortDirection={sortDirection} onSort={setSort} />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create job posting')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                title,
                description: description || undefined,
                application_deadline: deadline || undefined,
              })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Description')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="space-y-1">
              <Label>{t('Application deadline')}</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
