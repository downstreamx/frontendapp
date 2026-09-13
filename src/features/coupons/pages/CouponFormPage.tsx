import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createCoupon, getCoupon, updateCoupon } from '@/features/saas/saas-api'
import {
  CouponFormFields,
  couponToFormState,
  emptyCouponFormState,
  type CouponFormState,
} from '../components/CouponFormFields'

export function CouponFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { adminAllSetting } = useAppContext()
  const currencySymbol = adminAllSetting.currencySymbol || '$'
  const [form, setForm] = useState<CouponFormState>(emptyCouponFormState())

  const couponQuery = useQuery({
    queryKey: ['saas', 'coupons', id],
    queryFn: () => getCoupon(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (couponQuery.data) {
      setForm(couponToFormState(couponQuery.data))
    }
  }, [couponQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit Coupon') : t('Create Coupon'),
    breadcrumbs: [
      { label: t('Coupons'), url: paths.coupons },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
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
      return isEdit ? updateCoupon(Number(id), payload) : createCoupon(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Coupon updated') : t('Coupon created'))
      void queryClient.invalidateQueries({ queryKey: ['saas', 'coupons'] })
      navigate(isEdit ? paths.couponShow(Number(id)) : paths.couponShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save coupon'))),
  })

  if (isEdit && couponQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit Coupon') : t('Create Coupon')}</CardTitle>
      </CardHeader>
      <CardContent>
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
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('Saving...') : t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.couponShow(id) : paths.coupons}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
