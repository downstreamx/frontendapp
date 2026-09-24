import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import {
  convertVendorToSupplier,
  type VmVendor,
} from '@/features/vendor-management/vendor-management-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: VmVendor | null
  onEdit?: (vendor: VmVendor) => void
  onConverted?: () => void
}

export function VendorViewDialog({ open, onOpenChange, vendor, onEdit, onConverted }: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [confirmConvert, setConfirmConvert] = useState(false)

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.userType, 'edit-vm-vendors')
  const canConvert = hasPermission(
    auth.permissions,
    auth.roles,
    auth.userType,
    'convert-vm-vendors',
  )

  const convert = useMutation({
    mutationFn: convertVendorToSupplier,
    onSuccess: (res) => {
      toast.success(res.created ? t('Supplier created') : res.message || t('Supplier already exists'))
      onConverted?.()
      setConfirmConvert(false)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  if (!vendor) return null

  const isSupplier = Boolean(vendor.is_supplier)

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Code'), value: vendor.code || '—' },
    { label: t('Tax ID'), value: vendor.tax_id || '—' },
    { label: t('Contact'), value: vendor.contact_name || '—' },
    { label: t('Email'), value: vendor.contact_email || '—' },
    { label: t('Phone'), value: vendor.contact_phone || '—' },
    {
      label: t('Rating'),
      value: vendor.performance_rating != null ? String(vendor.performance_rating) : '—',
    },
    { label: t('Tags'), value: (vendor.performance_tags ?? []).join(', ') || '—' },
    { label: t('Capabilities'), value: vendor.capabilities || '—' },
    { label: t('Address'), value: vendor.address || '—' },
    { label: t('Notes'), value: vendor.notes || '—' },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold">{t('Vendor Details')}</DialogTitle>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm text-muted-foreground">{vendor.name}</p>
                  {isSupplier ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {t('Supplier')}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label} className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                <p className="rounded bg-muted/50 p-2 text-sm">{field.value}</p>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {canConvert && !isSupplier ? (
                <Button variant="outline" onClick={() => setConfirmConvert(true)}>
                  {t('To Supplier')}
                </Button>
              ) : null}
              {isSupplier ? (
                <p className="self-center text-xs text-muted-foreground">
                  {t('Already converted to a supplier')}
                </p>
              ) : null}
            </div>
            {canEdit && onEdit ? (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(vendor)
                }}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                {t('Edit')}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title={t('Convert to supplier?')}
        message={t(
          'This will create a supplier record from {{name}} using their contact email. Continue?',
          { name: vendor.name },
        )}
        confirmText={t('Convert')}
        loading={convert.isPending}
        onConfirm={() => convert.mutateAsync(vendor.id)}
      />
    </>
  )
}
