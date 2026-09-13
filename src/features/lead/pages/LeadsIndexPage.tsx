import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Kanban, List } from 'lucide-react'
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { personName } from '@/features/shared/lib/entity-labels'
import { CrmKanbanView } from '../components/CrmKanbanView'
import { createLead, fetchLeadIndexMeta, listLeadsPaginated, type LeadListItem } from '../lead-api'
import { useLeadMeta } from '../hooks/use-lead-meta'

type AppliedFilters = {
  pipeline_id: string
  stage_id: string
  user_id: string
}

const defaultFilters: AppliedFilters = {
  pipeline_id: '',
  stage_id: '',
  user_id: '',
}

export function LeadsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [stageId, setStageId] = useState('')
  const [userId, setUserId] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const viewMode = searchParams.get('view') === 'kanban' ? 'kanban' : 'list'

  usePageChrome({
    pageTitle: t('Leads'),
    breadcrumbs: [{ label: t('CRM') }, { label: t('Leads') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.pipeline_id) params.pipeline_id = appliedFilters.pipeline_id
    if (appliedFilters.stage_id) params.stage_id = appliedFilters.stage_id
    if (appliedFilters.user_id) params.user_id = appliedFilters.user_id
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['lead', 'leads', listParams],
    queryFn: () => listLeadsPaginated(listParams),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['lead', 'leads', 'index-meta'],
    queryFn: fetchLeadIndexMeta,
  })

  const { pipelineOptions, stageOptionsFor, userOptions } = useLeadMeta()

  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success(t('Lead created'))
      void queryClient.invalidateQueries({ queryKey: ['lead', 'leads'] })
      setCreateOpen(false)
      setName('')
      setEmail('')
      setPhone('')
      setPipelineId('')
      setStageId('')
      setUserId('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create lead'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

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

  const kanbanPipelineId =
    Number(appliedFilters.pipeline_id) ||
    Number(indexMeta?.pipelines?.[0]?.id) ||
    undefined

  const toggleView = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (viewMode === 'kanban') {
        next.delete('view')
      } else {
        next.set('view', 'kanban')
      }
      return next
    })
  }

  const columns: Column<LeadListItem>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <Link to={`${paths.lead.leads}/${row.id}`} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: 'email', header: t('Email'), sortable: true, render: (_, row) => row.email ?? '—' },
    { key: 'phone', header: t('Phone'), render: (_, row) => row.phone ?? '—' },
    { key: 'pipeline', header: t('Pipeline'), render: (_, row) => row.pipeline?.name ?? '—' },
    { key: 'stage', header: t('Stage'), render: (_, row) => row.stage?.name ?? '—' },
    {
      key: 'user',
      header: t('Owner'),
      render: (_, row) => personName(row.user, undefined),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Leads')}
        description={t('Manage prospects through pipelines and stages.')}
        canCreate
        onCreateClick={() => navigate(paths.lead.leadCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search leads...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: (
            <>
              <Button type="button" variant="outline" size="sm" onClick={toggleView}>
                {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <Kanban className="h-4 w-4" />}
              </Button>
              {viewMode === 'list' ? (
                <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />
              ) : null}
            </>
          ),
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Pipeline')}</Label>
                <Select
                  value={draftFilters.pipeline_id || 'all'}
                  onValueChange={(value) => {
                    setDraftFilters((f) => ({ ...f, pipeline_id: value === 'all' ? '' : value, stage_id: '' }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All pipelines')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All pipelines')}</SelectItem>
                    {(indexMeta?.pipelines ?? []).map((pipeline) => (
                      <SelectItem key={pipeline.id} value={String(pipeline.id)}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Stage')}</Label>
                <Select
                  value={draftFilters.stage_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, stage_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All stages')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All stages')}</SelectItem>
                    {stageOptionsFor(draftFilters.pipeline_id || pipelineId).map((stage) => (
                      <SelectItem key={stage.id} value={String(stage.id)}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Owner')}</Label>
                <Select
                  value={draftFilters.user_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, user_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All owners')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All owners')}</SelectItem>
                    {(indexMeta?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
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
        {viewMode === 'kanban' ? (
          <CrmKanbanView
            kind="leads"
            pipelineId={kanbanPipelineId}
            showPath={(id) => `${paths.lead.leads}/${id}`}
          />
        ) : rows.length === 0 && !isLoading ? (
          <NoRecordsFound hasFilters={hasFilters} onClearFilters={clearFilters} onCreateClick={() => navigate(paths.lead.leadCreate)} />
        ) : (
          <DataTable columns={columns} data={rows} sortField={sortField} sortDirection={sortDirection} onSort={setSort} />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create lead')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                name,
                email: email || undefined,
                phone: phone || undefined,
                pipeline_id: pipelineId ? Number(pipelineId) : undefined,
                stage_id: stageId ? Number(stageId) : undefined,
                user_id: userId ? Number(userId) : undefined,
              })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
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
            <div className="space-y-1">
              <Label>{t('Pipeline')}</Label>
              <EntitySelect value={pipelineId} onValueChange={setPipelineId} options={pipelineOptions} />
            </div>
            <div className="space-y-1">
              <Label>{t('Stage')}</Label>
              <EntitySelect value={stageId} onValueChange={setStageId} options={stageOptionsFor(pipelineId)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Owner')}</Label>
              <EntitySelect value={userId} onValueChange={setUserId} options={userOptions} />
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
