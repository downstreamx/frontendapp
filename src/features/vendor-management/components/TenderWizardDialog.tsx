import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatDateTime } from '@/utils/helpers'
import {
  addLineItem,
  createTender,
  deleteLineItem,
  deleteTenderDocument,
  getTender,
  getVendorManagementMeta,
  transitionTender,
  updateTender,
  uploadTenderDocument,
  type VmTender,
} from '@/features/vendor-management/vendor-management-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, dialog opens in edit mode for that draft tender. */
  tenderId?: number | null
  onSuccess?: () => void
}

export function TenderWizardDialog({ open, onOpenChange, tenderId: initialId = null, onSuccess }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [tenderId, setTenderId] = useState<number | null>(initialId)
  const [header, setHeader] = useState({
    name: '',
    code: '',
    description: '',
    submission_deadline: '',
    allow_multi_award: false,
  })
  const [stakeholderIds, setStakeholderIds] = useState<string[]>([])
  const [line, setLine] = useState({
    item_type: 'product' as 'product' | 'service',
    description: '',
    quantity: '1',
    unit: 'Litre',
  })

  useEffect(() => {
    if (!open) return
    setStep(0)
    setTenderId(initialId)
    if (!initialId) {
      setHeader({
        name: '',
        code: '',
        description: '',
        submission_deadline: '',
        allow_multi_award: false,
      })
      setStakeholderIds([])
      setLine({ item_type: 'product', description: '', quantity: '1', unit: 'Litre' })
    }
  }, [open, initialId])

  const meta = useQuery({
    queryKey: ['vm-meta'],
    queryFn: getVendorManagementMeta,
    enabled: open,
  })

  const detail = useQuery({
    queryKey: ['vm-tender', tenderId],
    queryFn: () => getTender(tenderId!),
    enabled: open && Boolean(tenderId),
  })

  const stakeholderOptions = useMemo(
    () =>
      (meta.data?.users ?? []).map((u) => ({
        value: String(u.id),
        label: u.email ? `${u.name} (${u.email})` : u.name,
      })),
    [meta.data?.users],
  )

  useEffect(() => {
    const tender = detail.data?.tender
    if (!tender || !open) return
    setHeader({
      name: tender.name,
      code: tender.code,
      description: tender.description ?? '',
      submission_deadline: tender.submission_deadline
        ? tender.submission_deadline.slice(0, 16)
        : '',
      allow_multi_award: Boolean(tender.allow_multi_award),
    })
    setStakeholderIds((tender.stakeholder_user_ids ?? []).map(String))
  }, [detail.data, open])

  const invalidate = (id?: number) => {
    void qc.invalidateQueries({ queryKey: ['vm-tenders'] })
    if (id) void qc.invalidateQueries({ queryKey: ['vm-tender', id] })
  }

  const saveHeader = useMutation({
    mutationFn: async () => {
      const payload = {
        name: header.name,
        code: header.code || undefined,
        description: header.description,
        submission_deadline: header.submission_deadline || undefined,
        stakeholder_user_ids: stakeholderIds.map(Number).filter((n) => Number.isFinite(n) && n > 0),
        allow_multi_award: header.allow_multi_award,
      }
      if (tenderId) return updateTender(tenderId, payload)
      return createTender(payload)
    },
    onSuccess: (tender: VmTender) => {
      setTenderId(tender.id)
      invalidate(tender.id)
      setStep(1)
      toast.success(t('Saved'))
      onSuccess?.()
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const addLine = useMutation({
    mutationFn: () =>
      addLineItem(tenderId!, {
        item_type: line.item_type,
        description: line.description,
        quantity: Number(line.quantity) || 1,
        unit: line.unit,
      }),
    onSuccess: () => {
      setLine({ item_type: 'product', description: '', quantity: '1', unit: 'Litre' })
      invalidate(tenderId!)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const removeLine = useMutation({
    mutationFn: (lineItemId: number) => deleteLineItem(tenderId!, lineItemId),
    onSuccess: () => invalidate(tenderId!),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const uploadDoc = useMutation({
    mutationFn: (file: File) => uploadTenderDocument(tenderId!, file),
    onSuccess: () => {
      toast.success(t('Document uploaded'))
      invalidate(tenderId!)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const removeDoc = useMutation({
    mutationFn: (documentId: number) => deleteTenderDocument(tenderId!, documentId),
    onSuccess: () => invalidate(tenderId!),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const publish = useMutation({
    mutationFn: async () => {
      await updateTender(tenderId!, {
        name: header.name,
        code: header.code || undefined,
        description: header.description,
        submission_deadline: header.submission_deadline || undefined,
        allow_multi_award: header.allow_multi_award,
        stakeholder_user_ids: stakeholderIds.map(Number).filter((n) => Number.isFinite(n) && n > 0),
      })
      return transitionTender(tenderId!, 'active')
    },
    onSuccess: () => {
      toast.success(t('Tender published'))
      invalidate(tenderId!)
      onOpenChange(false)
      navigate(paths.vendorManagement.tenderShow(tenderId!))
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const tender = detail.data?.tender
  const canPublish =
    Boolean(header.submission_deadline) && (tender?.line_items?.length ?? 0) > 0

  const stakeholderLabels = stakeholderOptions
    .filter((o) => stakeholderIds.includes(o.value))
    .map((o) => o.label)

  const closeAndOpen = () => {
    if (tenderId) {
      onOpenChange(false)
      navigate(paths.vendorManagement.tenderShow(tenderId))
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{initialId ? t('Edit Tender') : t('Create Tender')}</DialogTitle>
        </DialogHeader>

        <div className="mb-5 flex flex-wrap gap-2 border-b pb-3">
          {[t('Basics'), t('Line items'), t('Documents'), t('Review / Publish')].map((label, i) => (
            <button
              key={label}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                step === i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => tenderId && setStep(i)}
            >
              {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-3">
            <div>
              <Label>{t('Name')}</Label>
              <Input
                value={header.name}
                onChange={(e) => setHeader((h) => ({ ...h, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('Code')}</Label>
              <Input
                value={header.code}
                onChange={(e) => setHeader((h) => ({ ...h, code: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('Description')}</Label>
              <Textarea
                value={header.description}
                onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('Submission deadline')}</Label>
              <Input
                type="datetime-local"
                value={header.submission_deadline}
                onChange={(e) => setHeader((h) => ({ ...h, submission_deadline: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('Stakeholders')}</Label>
              <MultiSelectEnhanced
                options={stakeholderOptions}
                value={stakeholderIds}
                onValueChange={setStakeholderIds}
                placeholder={t('Select internal stakeholders')}
                searchable
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={header.allow_multi_award}
                onCheckedChange={(checked) =>
                  setHeader((h) => ({ ...h, allow_multi_award: checked }))
                }
              />
              <Label>{t('Allow multiple awards')}</Label>
            </div>
            <Button disabled={!header.name || saveHeader.isPending} onClick={() => saveHeader.mutate()}>
              {t('Save & continue')}
            </Button>
          </div>
        )}

        {step === 1 && tenderId && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">{t('Type')}</Label>
                <Select
                  value={line.item_type}
                  onValueChange={(value) =>
                    setLine((l) => ({
                      ...l,
                      item_type: value === 'service' ? 'service' : 'product',
                      unit: value === 'service' && l.unit === 'Litre' ? '' : l.unit,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">{t('Product')}</SelectItem>
                    <SelectItem value="service">{t('Service')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1 lg:col-span-1">
                <Label className="mb-1 block text-xs text-muted-foreground">{t('Description')}</Label>
                <Input
                  placeholder={t('Description')}
                  value={line.description}
                  onChange={(e) => setLine((l) => ({ ...l, description: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">{t('Quantity')}</Label>
                <Input
                  placeholder={t('Quantity')}
                  value={line.quantity}
                  onChange={(e) => setLine((l) => ({ ...l, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">{t('Unit')}</Label>
                <Input
                  placeholder={line.item_type === 'service' ? t('e.g. Hour, Job') : t('e.g. Litre')}
                  value={line.unit}
                  onChange={(e) => setLine((l) => ({ ...l, unit: e.target.value }))}
                />
              </div>
            </div>
            <Button disabled={!line.description || addLine.isPending} onClick={() => addLine.mutate()}>
              {t('Add line item')}
            </Button>
            <ul className="space-y-2 text-sm">
              {(tender?.line_items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {item.item_type === 'service' ? t('Service') : t('Product')}
                    </Badge>
                    <span className="truncate">
                      {item.description} — {item.quantity} {item.unit}
                    </span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeLine.mutate(item.id)}>
                    {t('Remove')}
                  </Button>
                </li>
              ))}
            </ul>
            <Button onClick={() => setStep(2)}>{t('Continue')}</Button>
          </div>
        )}

        {step === 2 && tenderId && (
          <div className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadDoc.mutate(file)
                e.target.value = ''
              }}
            />
            <ul className="space-y-2 text-sm">
              {(tender?.documents ?? []).map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{doc.title || doc.original_name}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeDoc.mutate(doc.id)}>
                    {t('Remove')}
                  </Button>
                </li>
              ))}
            </ul>
            <Button onClick={() => setStep(3)}>{t('Continue')}</Button>
          </div>
        )}

        {step === 3 && tenderId && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/20 p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('Tender')}
                </p>
                <h3 className="text-lg font-semibold leading-snug">
                  {header.name || tender?.name || '—'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {header.code || tender?.code || '—'}
                  {tender?.status ? (
                    <>
                      {' · '}
                      <span className="capitalize">{tender.status}</span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: t('Deadline'),
                    value: header.submission_deadline
                      ? formatDateTime(header.submission_deadline)
                      : '—',
                  },
                  {
                    label: t('Multi-award'),
                    value: header.allow_multi_award ? t('Yes') : t('No'),
                  },
                  {
                    label: t('Line items'),
                    value: String(tender?.line_items?.length ?? 0),
                  },
                  {
                    label: t('Documents'),
                    value: String(tender?.documents?.length ?? 0),
                  },
                ].map((field) => (
                  <div key={field.label} className="space-y-1 rounded-md bg-background/80 p-3 ring-1 ring-border/60">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-medium">{field.value}</p>
                  </div>
                ))}
                <div className="space-y-1 rounded-md bg-background/80 p-3 ring-1 ring-border/60 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">{t('Stakeholders')}</p>
                  <p className="text-sm font-medium">
                    {stakeholderLabels.length ? stakeholderLabels.join(', ') : '—'}
                  </p>
                </div>
              </div>

              {(tender?.line_items?.length ?? 0) > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('Scope')}
                  </p>
                  <ul className="divide-y rounded-md border bg-background">
                    {(tender?.line_items ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
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
                </div>
              ) : null}
            </div>

            {!canPublish ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t('Publish requires a submission deadline and at least one line item.')}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={closeAndOpen}>
                {t('Open without publishing')}
              </Button>
              {tender?.status === 'draft' ? (
                <Button disabled={!canPublish || publish.isPending} onClick={() => publish.mutate()}>
                  {t('Publish tender')}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
