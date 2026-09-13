import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createCoupon,
  updateCoupon,
  type CouponRow,
  type CouponWritePayload,
} from '@/features/saas/saas-api'
import {
  CouponFormFields,
  couponToFormState,
  emptyCouponFormState,
  type CouponFormState,
} from './CouponFormFields'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  coupon?: CouponRow | null
  onSuccess?: () => void
}

function toPayload(form: CouponFormState): CouponWritePayload {
  return {
    name: form.name,
    code: form.code,
    discount: form.discount,
    type: form.type,
    description: form.description || undefined,
    limit: form.limit,
    minimum_spend: form.minimum_spend,
    maximum_spend: form.maximum_spend,
    limit_per_user: form.limit_per_user,
    expiry_date: form.expiry_date || undefined,
    status: form.status,
  }
}

export function CouponFormDialog({ open, onOpenChange, mode, coupon, onSuccess }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { adminAllSetting } = useAppContext()
  const currencySymbol = adminAllSetting.currencySymbol || '$'
  const [form, setForm] = useState<CouponFormState>(emptyCouponFormState())

  useEffect(() => {
    if (!open) return
    setForm(mode === 'edit' && coupon ? couponToFormState(coupon) : emptyCouponFormState())
  }, [open, mode, coupon])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = toPayload(form)
      return mode === 'edit' && coupon
        ? updateCoupon(coupon.id, payload)
        : createCoupon(payload)
    },
    onSuccess: () => {
      toast.success(mode === 'edit' ? t('Coupon updated') : t('Coupon created'))
      void queryClient.invalidateQueries({ queryKey: ['saas', 'coupons'] })
      if (coupon?.id) {
        void queryClient.invalidateQueries({ queryKey: ['saas', 'coupons', String(coupon.id)] })
      }
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save coupon'))),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? t('Edit Coupon') : t('Create Coupon')}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <CouponFormFields
            value={form}
            onChange={setForm}
            currencySymbol={currencySymbol}
            disabled={saveMutation.isPending}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? mode === 'edit'
                  ? t('Updating...')
                  : t('Creating...')
                : mode === 'edit'
                  ? t('Update')
                  : t('Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
