import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createVendor,
  updateVendor,
  type VmVendor,
} from '@/features/vendor-management/vendor-management-api'

type FormState = {
  name: string
  code: string
  tax_id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  capabilities: string
  notes: string
  performance_rating: string
  performance_tags: string
  address: string
}

const emptyForm = (): FormState => ({
  name: '',
  code: '',
  tax_id: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  capabilities: '',
  notes: '',
  performance_rating: '',
  performance_tags: '',
  address: '',
})

function vendorToForm(vendor?: VmVendor | null): FormState {
  if (!vendor) return emptyForm()
  return {
    name: vendor.name ?? '',
    code: vendor.code ?? '',
    tax_id: vendor.tax_id ?? '',
    contact_name: vendor.contact_name ?? '',
    contact_email: vendor.contact_email ?? '',
    contact_phone: vendor.contact_phone ?? '',
    capabilities: vendor.capabilities ?? '',
    notes: vendor.notes ?? '',
    performance_rating: vendor.performance_rating?.toString() ?? '',
    performance_tags: (vendor.performance_tags ?? []).join(', '),
    address: vendor.address ?? '',
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  vendor?: VmVendor | null
  onSuccess: (vendor: VmVendor) => void
}

export function VendorFormDialog({ open, onOpenChange, mode, vendor, onSuccess }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (open) setForm(vendorToForm(mode === 'edit' ? vendor : null))
  }, [open, mode, vendor])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        performance_rating: form.performance_rating ? Number(form.performance_rating) : null,
        performance_tags: form.performance_tags
          ? form.performance_tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        code: form.code || null,
      }
      return mode === 'edit' && vendor
        ? updateVendor(vendor.id, payload)
        : createVendor(payload)
    },
    onSuccess: (row) => {
      toast.success(t('Saved'))
      onSuccess(row)
      onOpenChange(false)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const field = (key: keyof FormState, label: string, multiline = false) => (
    <div className="space-y-1">
      <Label htmlFor={`vm-vendor-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`vm-vendor-${key}`}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <Input
          id={`vm-vendor-${key}`}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? t('Edit Vendor') : t('Create Vendor')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field('name', t('Company name'))}</div>
          {field('code', t('Code'))}
          {field('tax_id', t('Tax ID'))}
          {field('contact_name', t('Contact name'))}
          {field('contact_email', t('Contact email'))}
          {field('contact_phone', t('Contact phone'))}
          {field('performance_rating', t('Performance rating (1-5)'))}
          <div className="sm:col-span-2">{field('performance_tags', t('Performance tags (comma-separated)'))}</div>
          <div className="sm:col-span-2">{field('capabilities', t('Capabilities'), true)}</div>
          <div className="sm:col-span-2">{field('address', t('Address'), true)}</div>
          <div className="sm:col-span-2">{field('notes', t('Notes'), true)}</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
