import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import KanbanBoard, { type KanbanColumn, type KanbanTask } from '@/components/kanban-board'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatDateTime } from '@/utils/helpers'
import { TenderWizardDialog } from '@/features/vendor-management/components/TenderWizardDialog'
import {
  addScoreCriterion,
  addTenderVendors,
  deleteScoreCriterion,
  deleteTenderDocument,
  getActivityLogs,
  getComparison,
  getTender,
  getVendorManagementMeta,
  inviteTenderVendor,
  listVendorsPaginated,
  sendOutcomeEmail,
  transitionTender,
  updateTenderVendorStage,
  uploadTenderDocument,
  upsertScores,
  type VmStage,
} from '@/features/vendor-management/vendor-management-api'

type OutcomePending = { tvId: number; type: 'awarded' | 'regretted'; vendorName: string } | null

type ActivityLogRow = {
  id: number
  action?: string
  actor_user_id?: number | null
  subject_id?: number | null
  created_at?: string | null
  from_value?: Record<string, unknown> | null
  to_value?: Record<string, unknown> | null
  payload?: Record<string, unknown> | null
}

function formatStageLabel(slugOrName: string | undefined | null, stages: VmStage[]): string {
  if (!slugOrName) return '—'
  const match = stages.find((s) => s.slug === slugOrName || s.name === slugOrName)
  return match?.name ?? slugOrName.replace(/-/g, ' ')
}

function resolveStageLabel(
  value: Record<string, unknown>,
  stages: VmStage[],
): string {
  const bySlug =
    (value.stage as string | undefined) ??
    (value.label as string | undefined) ??
    (value.slug as string | undefined)
  if (bySlug) return formatStageLabel(bySlug, stages)
  const id = Number(value.stage_id)
  if (Number.isFinite(id) && id > 0) {
    const match = stages.find((s) => s.id === id)
    if (match) return match.name
  }
  return '—'
}

function activityTitle(action: string | undefined, t: (key: string) => string): string {
  switch (action) {
    case 'tender.created':
      return t('Tender created')
    case 'tender.updated':
      return t('Tender updated')
    case 'tender.status_changed':
      return t('Status changed')
    case 'tender_vendor.stage_changed':
      return t('Vendor moved to a new stage')
    case 'tender_vendor.invited':
      return t('Invitation sent')
    case 'tender_vendor.outcome_email_sent':
      return t('Outcome email sent')
    case 'tender_vendor.scored':
      return t('Scores saved')
    default:
      return action ? action.replace(/[._]/g, ' ') : t('Activity')
  }
}

function activityDetail(
  log: ActivityLogRow,
  stages: VmStage[],
  vendorName: string | null,
  t: (key: string) => string,
): string | null {
  const from = log.from_value ?? {}
  const to = log.to_value ?? {}
  const payload = log.payload ?? {}
  const vendorPrefix = vendorName ? `${vendorName}: ` : ''

  if (log.action === 'tender_vendor.stage_changed') {
    return `${vendorPrefix}${resolveStageLabel(from, stages)} → ${resolveStageLabel(to, stages)}`
  }

  if (log.action === 'tender.status_changed') {
    const fromStatus = String(from.status ?? from.value ?? '—')
    const toStatus = String(to.status ?? to.value ?? '—')
    return `${fromStatus} → ${toStatus}`
  }

  if (log.action === 'tender_vendor.outcome_email_sent') {
    const type = String(payload.type ?? to.type ?? '')
    const label =
      type === 'awarded'
        ? t('Award notification')
        : type === 'regretted'
          ? t('Regret notification')
          : type || null
    return label ? `${vendorPrefix}${label}` : vendorName
  }

  if (log.action === 'tender_vendor.scored') {
    const total = payload.weighted_total ?? to.weighted_total
    const scorePart = total != null ? `${t('Weighted score')}: ${total}` : null
    if (vendorName && scorePart) return `${vendorName} — ${scorePart}`
    return scorePart ?? vendorName
  }

  if (log.action === 'tender_vendor.invited') {
    const email = payload.email ?? to.email
    if (vendorName && email) return `${vendorName} · ${String(email)}`
    return email ? String(email) : vendorName
  }

  return vendorName
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2.5 py-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  )
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border bg-muted/20 px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export function TenderShowPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const qc = useQueryClient()
  const { auth } = useAppContext()
  const [vendorPick, setVendorPick] = useState('')
  const [criterionName, setCriterionName] = useState('')
  const [scoreVendorId, setScoreVendorId] = useState<number | null>(null)
  const [outcomePending, setOutcomePending] = useState<OutcomePending>(null)
  const [editOpen, setEditOpen] = useState(false)

  const canInvite = hasPermission(auth.permissions, auth.roles, auth.userType, 'manage-vm-invitations')
  const canScore = hasPermission(auth.permissions, auth.roles, auth.userType, 'manage-vm-scoring')
  const canOutcome = hasPermission(auth.permissions, auth.roles, auth.userType, 'send-vm-outcome-emails')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.userType, 'edit-vm-tenders')
  const canReports = hasPermission(auth.permissions, auth.roles, auth.userType, 'view-vm-reports')

  const detail = useQuery({
    queryKey: ['vm-tender', id],
    queryFn: () => getTender(id!),
    enabled: Boolean(id),
  })

  const meta = useQuery({
    queryKey: ['vm-meta'],
    queryFn: getVendorManagementMeta,
  })
  const metaUsers = meta.data?.users

  const vendorsCatalog = useQuery({
    queryKey: ['vm-vendors-pick'],
    queryFn: () => listVendorsPaginated({ per_page: 100 }),
  })

  const comparison = useQuery({
    queryKey: ['vm-comparison', id],
    queryFn: () => getComparison(id!),
    enabled: Boolean(id) && canReports,
  })

  const logs = useQuery({
    queryKey: ['vm-logs', id],
    queryFn: () => getActivityLogs(id!),
    enabled: Boolean(id),
  })

  usePageChrome({
    title: detail.data?.tender.name ?? t('Tender'),
    breadcrumbs: [
      { label: t('Vendor Mgt.') },
      { label: t('Tenders'), href: paths.vendorManagement.tenders },
    ],
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['vm-tender', id] })
    void qc.invalidateQueries({ queryKey: ['vm-comparison', id] })
    void qc.invalidateQueries({ queryKey: ['vm-logs', id] })
  }

  const activate = useMutation({
    mutationFn: (status: string) => transitionTender(id!, status),
    onSuccess: () => {
      toast.success(t('Status updated'))
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const addVendors = useMutation({
    mutationFn: (vendorId: number) => addTenderVendors(id!, [vendorId]),
    onSuccess: () => {
      toast.success(t('Vendor added'))
      setVendorPick('')
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const invite = useMutation({
    mutationFn: (tvId: number) => inviteTenderVendor(id!, tvId),
    onSuccess: (res) => {
      toast.success(res.email_sent ? t('Invitation sent') : t('Invitation link created'))
      if (res.invitation_url) {
        void navigator.clipboard?.writeText(res.invitation_url)
        toast.message(t('Link copied to clipboard'))
      }
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const moveStage = useMutation({
    mutationFn: ({ tvId, stageId }: { tvId: number; stageId: number }) =>
      updateTenderVendorStage(id!, tvId, stageId),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const outcome = useMutation({
    mutationFn: ({ tvId, type }: { tvId: number; type: 'awarded' | 'regretted' }) =>
      sendOutcomeEmail(id!, tvId, type),
    onSuccess: () => {
      toast.success(t('Outcome email sent'))
      setOutcomePending(null)
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const addCriterion = useMutation({
    mutationFn: () => addScoreCriterion(id!, { name: criterionName, weight: 1, max_score: 10 }),
    onSuccess: () => {
      setCriterionName('')
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const removeCriterion = useMutation({
    mutationFn: (criterionId: number) => deleteScoreCriterion(id!, criterionId),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const uploadDoc = useMutation({
    mutationFn: (file: File) => uploadTenderDocument(id!, file),
    onSuccess: () => {
      toast.success(t('Document uploaded'))
      invalidate()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const removeDoc = useMutation({
    mutationFn: (documentId: number) => deleteTenderDocument(id!, documentId),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const tender = detail.data?.tender
  const metrics = detail.data?.metrics

  const columns: KanbanColumn[] = useMemo(
    () =>
      (tender?.stages ?? []).map((s) => ({
        id: String(s.id),
        title: s.name,
        color: s.color || '#64748b',
      })),
    [tender?.stages],
  )

  const tasks: Record<string, KanbanTask[]> = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {}
    for (const col of columns) map[col.id] = []
    for (const tv of tender?.tender_vendors ?? []) {
      const key = String(tv.stage_id ?? columns[0]?.id)
      if (!map[key]) map[key] = []
      map[key].push({
        id: tv.id,
        title: tv.vendor?.name ?? `Vendor #${tv.vendor_id}`,
        description: tv.submitted_at ? t('Submitted') : t('Not submitted'),
      })
    }
    return map
  }, [tender?.tender_vendors, columns, t])

  const stakeholderNames = useMemo(() => {
    const ids = tender?.stakeholder_user_ids ?? []
    if (!ids.length) return '—'
    return ids
      .map((uid) => {
        const user = (metaUsers ?? []).find((u) => u.id === uid)
        return user ? user.name : `#${uid}`
      })
      .join(', ')
  }, [tender?.stakeholder_user_ids, metaUsers])

  if (detail.isLoading) {
    return (
      <ModuleListCard title={t('Tender')}>
        <PageContentLoader className="min-h-[12rem] py-8" />
      </ModuleListCard>
    )
  }
  if (!tender) {
    return (
      <ModuleListCard title={t('Tender')}>
        <p className="px-6 pb-6 text-sm text-muted-foreground">{t('Not found')}</p>
      </ModuleListCard>
    )
  }

  const comparisonVendors = (comparison.data?.vendors as Array<Record<string, unknown>>) ?? []
  const comparisonLines = (comparison.data?.line_items as Array<{ id: number; description: string }>) ?? []
  const daysToDeadline =
    typeof metrics?.days_to_deadline === 'number'
      ? Math.round(Number(metrics.days_to_deadline))
      : null
  const stages = tender.stages ?? []
  const activityLogs = (logs.data as ActivityLogRow[] | undefined) ?? []

  return (
    <ModuleListCard
      title={`${tender.name} (${tender.code})`}
      actions={
        <div className="flex flex-wrap gap-2">
          {canEdit && tender.status === 'draft' ? (
            <Button size="sm" onClick={() => activate.mutate('active')}>
              {t('Publish / Activate')}
            </Button>
          ) : null}
          {canEdit && tender.status === 'active' ? (
            <Button size="sm" variant="outline" onClick={() => activate.mutate('reviewing')}>
              {t('Mark reviewing')}
            </Button>
          ) : null}
          {canEdit && ['active', 'reviewing'].includes(tender.status) ? (
            <Button size="sm" variant="outline" onClick={() => activate.mutate('awarded')}>
              {t('Close as awarded')}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            {t('Edit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="capitalize">{tender.status}</Badge>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <MetaChip
              label={t('Deadline')}
              value={
                tender.submission_deadline ? formatDateTime(tender.submission_deadline) : '—'
              }
            />
            <MetaChip
              label={t('Days left')}
              value={
                daysToDeadline == null
                  ? '—'
                  : daysToDeadline < 0
                    ? t('{{n}} overdue', { n: Math.abs(daysToDeadline) })
                    : String(daysToDeadline)
              }
            />
            <MetaChip label={t('Invited')} value={String(metrics?.invited_count ?? 0)} />
            <MetaChip label={t('Submitted')} value={String(metrics?.submitted_count ?? 0)} />
            <MetaChip
              label={t('Submission rate')}
              value={`${String(metrics?.submission_rate ?? 0)}%`}
            />
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
            <TabsTrigger value="scope">{t('Scope')}</TabsTrigger>
            <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
            <TabsTrigger value="vendors">{t('Vendors')}</TabsTrigger>
            <TabsTrigger value="board">{t('Kanban')}</TabsTrigger>
            <TabsTrigger value="scoring">{t('Scoring')}</TabsTrigger>
            {canReports ? <TabsTrigger value="comparison">{t('Comparison')}</TabsTrigger> : null}
            <TabsTrigger value="activity">{t('Activity')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {tender.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{tender.description}</p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailTile label={t('Multi-award')} value={tender.allow_multi_award ? t('Yes') : t('No')} />
              <DetailTile label={t('Stakeholders')} value={stakeholderNames} />
              <DetailTile label={t('Line items')} value={String(tender.line_items?.length ?? 0)} />
              <DetailTile label={t('Documents')} value={String(tender.documents?.length ?? 0)} />
              <DetailTile label={t('Longlist')} value={String(tender.tender_vendors?.length ?? 0)} />
            </div>
            {metrics?.by_stage && typeof metrics.by_stage === 'object' ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('Pipeline')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(metrics.by_stage as Record<string, number>).map(([slug, count]) => (
                    <Badge key={slug} variant="secondary" className="gap-1.5 font-normal">
                      <span className="capitalize">{formatStageLabel(slug, stages)}</span>
                      <span className="rounded bg-background/80 px-1.5 text-xs font-semibold">{count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="scope" className="mt-4">
            {(tender.line_items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No line items yet.')}</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {(tender.line_items ?? []).map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {item.item_type === 'service' ? t('Service') : t('Product')}
                      </Badge>
                      <span className="font-medium">{item.description}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {canEdit ? (
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadDoc.mutate(file)
                  e.target.value = ''
                }}
              />
            ) : null}
            {(tender.documents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No documents yet.')}</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {(tender.documents ?? []).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <span>
                      {doc.title || doc.original_name}
                      {doc.visible_to_vendors ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({t('Visible to vendors')})
                        </span>
                      ) : null}
                    </span>
                    {canEdit ? (
                      <Button size="sm" variant="ghost" onClick={() => removeDoc.mutate(doc.id)}>
                        {t('Remove')}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="vendors" className="mt-4 space-y-3">
            <div className="flex max-w-lg gap-2">
              <select
                className="flex h-9 w-full rounded-md border px-3 text-sm"
                value={vendorPick}
                onChange={(e) => setVendorPick(e.target.value)}
              >
                <option value="">{t('Select vendor')}</option>
                {(vendorsCatalog.data?.rows ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <Button disabled={!vendorPick} onClick={() => addVendors.mutate(Number(vendorPick))}>
                {t('Add')}
              </Button>
            </div>
            <ul className="divide-y rounded-lg border">
              {(tender.tender_vendors ?? []).map((tv) => (
                <li
                  key={tv.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{tv.vendor?.name}</p>
                    <p className="text-xs text-muted-foreground">{tv.stage?.name ?? '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {canInvite ? (
                      <Button size="sm" variant="outline" onClick={() => invite.mutate(tv.id)}>
                        {t('Send invite')}
                      </Button>
                    ) : null}
                    {canOutcome ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setOutcomePending({
                              tvId: tv.id,
                              type: 'awarded',
                              vendorName: tv.vendor?.name ?? String(tv.vendor_id),
                            })
                          }
                        >
                          {t('Email award')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setOutcomePending({
                              tvId: tv.id,
                              type: 'regretted',
                              vendorName: tv.vendor?.name ?? String(tv.vendor_id),
                            })
                          }
                        >
                          {t('Email regret')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="board" className="mt-4">
            <KanbanBoard
              columns={columns}
              tasks={tasks}
              onMove={(taskId, _from, to) => {
                moveStage.mutate({ tvId: taskId, stageId: Number(to) })
              }}
            />
          </TabsContent>

          <TabsContent value="scoring" className="mt-4 space-y-4">
            {canScore ? (
              <div className="flex max-w-md gap-2">
                <Input
                  placeholder={t('Criterion name')}
                  value={criterionName}
                  onChange={(e) => setCriterionName(e.target.value)}
                />
                <Button disabled={!criterionName} onClick={() => addCriterion.mutate()}>
                  {t('Add criterion')}
                </Button>
              </div>
            ) : null}
            {(tender.score_criteria ?? []).length > 0 ? (
              <ul className="divide-y rounded-lg border">
                {(tender.score_criteria ?? []).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t('Weight')} {c.weight} · {t('Max')} {c.max_score}
                      </span>
                    </span>
                    {canScore ? (
                      <Button size="sm" variant="ghost" onClick={() => removeCriterion.mutate(c.id)}>
                        {t('Remove')}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('No scoring criteria yet.')}</p>
            )}

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-semibold">{t('Score a vendor')}</p>
              <div className="mb-3 max-w-md">
                <Label className="mb-1 block text-xs text-muted-foreground">{t('Vendor')}</Label>
                <select
                  className="flex h-9 w-full rounded-md border px-3 text-sm"
                  value={scoreVendorId ?? ''}
                  onChange={(e) => setScoreVendorId(Number(e.target.value) || null)}
                >
                  <option value="">{t('Select longlist vendor')}</option>
                  {(tender.tender_vendors ?? []).map((tv) => (
                    <option key={tv.id} value={tv.id}>
                      {tv.vendor?.name}
                    </option>
                  ))}
                </select>
              </div>
              {scoreVendorId && canScore ? (
                <ScoreForm
                  tenderId={Number(id)}
                  tenderVendorId={scoreVendorId}
                  criteria={tender.score_criteria ?? []}
                  onSaved={invalidate}
                />
              ) : null}
            </div>
          </TabsContent>

          {canReports ? (
            <TabsContent value="comparison" className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 font-medium">{t('Vendor')}</th>
                    <th className="px-3 py-2 font-medium">{t('Stage')}</th>
                    {comparisonLines.map((line) => (
                      <th key={line.id} className="px-3 py-2 font-medium">
                        {line.description}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">{t('Total')}</th>
                    <th className="px-3 py-2 font-medium">{t('Score')}</th>
                    <th className="px-3 py-2 font-medium">{t('Outcome email')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonVendors.map((row) => {
                    const vendor = row.vendor as { name?: string } | undefined
                    const stage = row.stage as { name?: string } | undefined
                    const linePrices =
                      (row.line_prices as Record<string, { line_total?: number } | null>) ?? {}
                    return (
                      <tr key={String(row.tender_vendor_id)} className="border-b">
                        <td className="px-3 py-2">{vendor?.name}</td>
                        <td className="px-3 py-2">{stage?.name}</td>
                        {comparisonLines.map((line) => (
                          <td key={line.id} className="px-3 py-2">
                            {linePrices[String(line.id)]?.line_total ?? '—'}
                          </td>
                        ))}
                        <td className="px-3 py-2">{String(row.total_amount ?? '—')}</td>
                        <td className="px-3 py-2">{String(row.weighted_score ?? '—')}</td>
                        <td className="px-3 py-2">
                          {row.outcome_email_type
                            ? `${row.outcome_email_type}${
                                row.outcome_email_sent_at
                                  ? ` · ${formatDateTime(String(row.outcome_email_sent_at))}`
                                  : ''
                              }`
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TabsContent>
          ) : null}

          <TabsContent value="activity" className="mt-4">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No activity yet.')}</p>
            ) : (
              <ol className="relative space-y-0 border-l border-border pl-4">
                {activityLogs.map((log) => {
                  const actor = metaUsers?.find((u) => u.id === log.actor_user_id)
                  const tv = (tender.tender_vendors ?? []).find((row) => row.id === log.subject_id)
                  const vendorName = tv?.vendor?.name ?? null
                  const detailText = activityDetail(log, stages, vendorName, t)
                  return (
                    <li key={log.id} className="relative pb-4 last:pb-0">
                      <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                      <div className="rounded-md border bg-muted/20 px-3 py-2.5">
                        <p className="text-sm font-semibold">{activityTitle(log.action, t)}</p>
                        {detailText ? (
                          <p className="mt-0.5 text-sm text-foreground/90">{detailText}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {log.created_at ? formatDateTime(log.created_at) : ''}
                          {actor
                            ? ` · ${actor.name}`
                            : log.actor_user_id
                              ? ` · ${t('User')} #${log.actor_user_id}`
                              : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TenderWizardDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenderId={tender.id}
        onSuccess={invalidate}
      />

      <ConfirmationDialog
        open={Boolean(outcomePending)}
        onOpenChange={(open) => {
          if (!open) setOutcomePending(null)
        }}
        title={
          outcomePending?.type === 'awarded'
            ? t('Send award email?')
            : t('Send regret email?')
        }
        message={
          outcomePending
            ? t(
                'This will email {{vendor}}. Outcome emails are never sent automatically when changing stages.',
                { vendor: outcomePending.vendorName },
              )
            : undefined
        }
        confirmText={t('Send email')}
        loading={outcome.isPending}
        onConfirm={() => {
          if (!outcomePending) return
          return outcome.mutateAsync({
            tvId: outcomePending.tvId,
            type: outcomePending.type,
          })
        }}
      />
    </ModuleListCard>
  )
}

function ScoreForm({
  tenderId,
  tenderVendorId,
  criteria,
  onSaved,
}: {
  tenderId: number
  tenderVendorId: number
  criteria: Array<{ id: number; name: string; max_score: number | string }>
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [scores, setScores] = useState<Record<number, string>>({})
  const [comments, setComments] = useState<Record<number, string>>({})

  const save = useMutation({
    mutationFn: () =>
      upsertScores(
        tenderId,
        tenderVendorId,
        criteria.map((c) => ({
          criterion_id: c.id,
          score: Number(scores[c.id] ?? 0),
          comment: comments[c.id] || undefined,
        })),
      ),
    onSuccess: (res) => {
      toast.success(`${t('Saved')} — ${t('Weighted')}: ${res.weighted_total}`)
      onSaved()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  if (criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('Add criteria before scoring.')}</p>
  }

  return (
    <div className="space-y-3">
      {criteria.map((c) => (
        <div
          key={c.id}
          className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_7rem]"
        >
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {c.name}{' '}
              <span className="font-normal text-muted-foreground">(/ {c.max_score})</span>
            </Label>
            <Input
              placeholder={t('Comment (optional)')}
              value={comments[c.id] ?? ''}
              onChange={(e) => setComments((s) => ({ ...s, [c.id]: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('Score')}</Label>
            <Input
              type="number"
              min={0}
              max={Number(c.max_score) || undefined}
              step="0.1"
              value={scores[c.id] ?? ''}
              onChange={(e) => setScores((s) => ({ ...s, [c.id]: e.target.value }))}
            />
          </div>
        </div>
      ))}
      <Button disabled={save.isPending} onClick={() => save.mutate()}>
        {t('Save scores')}
      </Button>
    </div>
  )
}
