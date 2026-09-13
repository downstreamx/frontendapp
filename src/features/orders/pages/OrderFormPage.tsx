import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createOrder, listPlans } from '@/features/saas/saas-api'

export function OrderFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [planId, setPlanId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const plansQuery = useQuery({ queryKey: ['saas', 'plans'], queryFn: listPlans })

  const planOptions = (plansQuery.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
  }))

  usePageChrome({
    pageTitle: t('Create order'),
    breadcrumbs: [
      { label: t('Orders'), url: paths.orders },
      { label: t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      createOrder({
        plan_id: Number(planId),
        name: name || undefined,
        email: email || undefined,
      }),
    onSuccess: (row) => {
      toast.success(t('Order created'))
      navigate(paths.orderShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create order'))),
  })

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('Create order')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!planId) return
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Plan')}</Label>
            <EntitySelect
              value={planId}
              onValueChange={setPlanId}
              options={planOptions}
              disabled={plansQuery.isLoading}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Customer name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('Email')}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending || !planId || plansQuery.isLoading}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={paths.orders}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
