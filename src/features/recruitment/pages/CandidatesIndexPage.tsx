import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { EntitySelect } from '@/components/forms/entity-select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  candidateFullName,
  createCandidate,
  fetchCandidatesIndexMeta,
  listCandidatesPaginated,
  type CandidateListItem,
} from '../recruitment-candidates-api'

type AppliedFilters = {
  job_id: string
  source_id: string
  status: string
}

const defaultFilters: AppliedFilters = { job_id: '', source_id: '', status: '' }

const statusLabel = (value: string | undefined, statuses: Array<{ value: string; label: string }>) =>
  statuses.find((s) => s.value === value)?.label ?? value ?? '—'

export function CandidatesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobId, setJobId] = useState('')
  const [sourceId, setSourceId] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Candidates'),
    breadcrumbs: [{ label: t('Recruitment') }, { label: t('Candidates') }],
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['recruitment', 'candidates', 'index-meta'],
    queryFn: fetchCandidatesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.job_id) params.job_id = appliedFilters.job_id
    if (appliedFilters.source_id) params.source_id = appliedFilters.source_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruitment', 'candidates', listParams],
    queryFn: () => listCandidatesPaginated(listParams),
  })

  const createMutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      toast.success(t('Candidate created'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidates'] })
      setCreateOpen(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setJobId('')
      setSourceId('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create candidate'))),
  })

  const jobOptions =
    indexMeta?.job_postings.map((j) => ({ id: j.id, label: j.title })) ?? []
  const sourceOptions = indexMeta?.sources.map((s) => ({ id: s.id, label: s.name })) ?? []
  const statuses = indexMeta?.statuses ?? []

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const columns: Column<CandidateListItem>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.recruitment.candidateShow(row.id)} className="text-primary hover:underline">
          {candidateFullName(row)}
        </Link>
      ),
    },
    { key: 'email', header: t('Email'), render: (_, row) => row.email ?? '—' },
    {
      key: 'job',
      header: t('Job posting'),
      render: (_, row) => row.job_posting?.title ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => (
        <FleetStatusBadge status={statusLabel(row.status, statuses)} />
      ),
    },
    {
      key: 'application_date',
      header: t('Applied'),
      sortable: true,
      render: (_, row) => (row.application_date ? formatDate(row.application_date) : '—'),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Candidates')}
        description={t('Review applications and manage hiring pipeline.')}
        canCreate
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: () => {
            toolbar.applySearch()
            setAppliedFilters(draftFilters)
          },
          searchPlaceholder: t('Search candidates...'),
          showFilters,
          onToggleFilters: () => setShowFilters((o) => !o),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: () => {
            toolbar.applySearch()
            setAppliedFilters(draftFilters)
          },
          onClearFilters: () => {
            toolbar.clearSearch()
            setDraftFilters(defaultFilters)
            setAppliedFilters(defaultFilters)
          },
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Job posting')}</Label>
                <EntitySelect
                  value={draftFilters.job_id}
                  onValueChange={(v) => setDraftFilters((f) => ({ ...f, job_id: v }))}
                  options={jobOptions}
                  placeholder={t('All jobs')}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Source')}</Label>
                <EntitySelect
                  value={draftFilters.source_id}
                  onValueChange={(v) => setDraftFilters((f) => ({ ...f, source_id: v }))}
                  options={sourceOptions}
                  placeholder={t('All sources')}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(v) =>
                    setDraftFilters((f) => ({ ...f, status: v === 'all' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
            onClearFilters={() => {
              toolbar.clearSearch()
              setAppliedFilters(defaultFilters)
            }}
            onCreateClick={() => setCreateOpen(true)}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) =>
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
          />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add candidate')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                first_name: firstName,
                last_name: lastName,
                email: email || undefined,
                phone: phone || undefined,
                job_id: jobId ? Number(jobId) : undefined,
                source_id: sourceId ? Number(sourceId) : undefined,
              })
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('First name')}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t('Last name')}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Phone')}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <EntitySelect
              value={jobId}
              onValueChange={setJobId}
              options={jobOptions}
              placeholder={t('Job posting')}
            />
            <EntitySelect
              value={sourceId}
              onValueChange={setSourceId}
              options={sourceOptions}
              placeholder={t('Source')}
            />
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
