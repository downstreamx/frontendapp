import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { deletePlan, getPlan } from '@/features/saas/saas-api'

export function PlanShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: plan, isLoading } = useQuery({
    queryKey: ['saas', 'plan', id],
    queryFn: () => getPlan(id!),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePlan(Number(id)),
    onSuccess: () => {
      toast.success(t('Plan deleted'))
      void queryClient.invalidateQueries({ queryKey: ['saas', 'plans'] })
      navigate(paths.plans)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete plan'))),
  })

  usePageChrome({
    pageTitle: plan?.name ?? t('Plan'),
    breadcrumbs: [
      { label: t('Plans'), url: paths.plans },
      { label: plan?.name ?? `#${id}` },
    ],
  })

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{plan?.name ?? t('Plan')}</CardTitle>
        <div className="flex gap-2">
          {plan ? (
            <Button asChild size="sm" variant="outline">
              <Link to={paths.planEdit(plan.id)}>{t('Edit')}</Link>
            </Button>
          ) : null}
          {plan ? (
            <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
              {t('Delete')}
            </Button>
          ) : null}
          <Link to={paths.plans} className="text-sm text-primary hover:underline self-center">
            {t('Back to plans')}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {isLoading ? <div className="text-muted-foreground">{t('Loading…')}</div> : null}
        {plan ? (
          <>
            {plan.description ? <div>{plan.description}</div> : null}
            <div>
              {t('Monthly')}: {plan.package_price_monthly != null ? `$${plan.package_price_monthly}` : '—'}
            </div>
            <div>
              {t('Yearly')}: {plan.package_price_yearly != null ? `$${plan.package_price_yearly}` : '—'}
            </div>
            {plan.modules?.length ? (
              <div>
                {t('Modules')}: {plan.modules.join(', ')}
              </div>
            ) : null}
            <div>{t('Status')}: {plan.status ? t('Active') : t('Inactive')}</div>
          </>
        ) : null}
      </CardContent>
    </Card>

    <ConfirmationDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title={t('Delete plan')}
      message={t('Delete this plan? Plans with active subscribers cannot be removed.')}
      variant="destructive"
      confirmText={t('Delete')}
      onConfirm={() => deleteMutation.mutate()}
      loading={deleteMutation.isPending}
    />
    </>
  )
}
