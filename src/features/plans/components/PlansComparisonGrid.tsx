import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Clock, Edit, MoreVertical, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { deletePlan, type PlanRow } from '@/features/saas/saas-api'
import { formatAdminCurrency, formatStorage, getPackageAlias } from '@/utils/helpers'

type ActiveModule = {
  module: string
  alias: string
}

type Props = {
  plans: PlanRow[]
  activeModules: ActiveModule[]
  isSuperAdmin: boolean
  canCreate: boolean
}

export function PlansComparisonGrid({ plans, activeModules, isSuperAdmin, canCreate }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [deletingPlan, setDeletingPlan] = useState<PlanRow | null>(null)

  const activePlans = useMemo(() => plans.filter((plan) => plan.status !== false), [plans])

  const allModules = useMemo(
    () =>
      [...activeModules]
        .map((row) => ({
          module: row.module,
          alias: row.alias || getPackageAlias(row.module) || row.module,
        }))
        .sort((a, b) => a.alias.localeCompare(b.alias)),
    [activeModules],
  )

  const mostPopularPlanId = useMemo(() => {
    if (activePlans.length <= 1) return null
    const best = activePlans.reduce((prev, current) =>
      (current.orders_count ?? 0) > (prev.orders_count ?? 0) ? current : prev,
    )
    return (best.orders_count ?? 0) > 0 ? best.id : activePlans[1]?.id ?? null
  }, [activePlans])

  const gridStyle = {
    gridTemplateColumns: `300px repeat(${activePlans.length}, 280px)`,
    minWidth: `${300 + activePlans.length * 280 + Math.max(0, activePlans.length - 1) * 24}px`,
  }

  const hasModule = (plan: PlanRow, module: string) =>
    Array.isArray(plan.modules) ? plan.modules.includes(module) : false

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onSuccess: () => {
      toast.success(t('Plan deleted'))
      setDeletingPlan(null)
      void queryClient.invalidateQueries({ queryKey: ['saas', 'plans'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete plan'))),
  })

  if (activePlans.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">{t('No active plans found')}</h3>
        <p className="mb-4 text-muted-foreground">{t('Create your first plan to get started')}</p>
        {canCreate ? (
          <Button onClick={() => navigate(paths.planCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Create Plan')}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="rounded-lg bg-muted p-1">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPricingPeriod('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                pricingPeriod === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('Monthly')}
            </button>
            <button
              type="button"
              onClick={() => setPricingPeriod('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                pricingPeriod === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('Yearly')}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 overflow-x-auto pt-6">
        <div className="grid gap-6" style={gridStyle}>
          <div className="sticky left-0 z-20 rounded-2xl border border-border bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-center">
              <h3 className="text-xl font-bold">{t('Features')}</h3>
            </div>
          </div>

          {activePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.id === mostPopularPlanId
                  ? 'border-primary bg-background ring-2 ring-primary/20'
                  : 'border-border bg-background'
              }`}
            >
              {plan.id === mostPopularPlanId && activePlans.length > 1 ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg">
                    ⭐ {t('Most Popular')}
                  </Badge>
                </div>
              ) : null}

              {isSuperAdmin ? (
                <div className="absolute right-4 top-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={paths.planEdit(plan.id)} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          {t('Edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingPlan(plan)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}

              <div className="space-y-4 text-center">
                <div>
                  <h3 className="mb-1 text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>

                {plan.free_plan ? (
                  <div>
                    <div className="mb-1 text-4xl font-black text-primary">{t('Free')}</div>
                    <div className="font-semibold text-primary">{t('Forever')}</div>
                  </div>
                ) : (
                  <div className="mb-2 flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-black">
                      {formatAdminCurrency(
                        pricingPeriod === 'monthly'
                          ? (plan.package_price_monthly ?? 0)
                          : (plan.package_price_yearly ?? 0),
                      ).replace(/\.00$/, '')}
                    </span>
                    <span className="text-xl font-semibold text-muted-foreground">
                      /{pricingPeriod === 'monthly' ? t('mo') : t('yr')}
                    </span>
                  </div>
                )}

                <div className="space-y-3 py-4 text-left">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm font-medium">
                      {plan.number_of_users === -1
                        ? t('Unlimited users')
                        : `${plan.number_of_users ?? 0} ${t('users')}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm font-medium">
                      {formatStorage(plan.storage_limit ?? 0)} {t('storage')}
                    </span>
                  </div>
                  {plan.trial ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {plan.trial_days}d {t('trial')}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6" style={gridStyle}>
          <div className="sticky left-0 z-20 rounded-2xl border border-border bg-background p-6">
            <div className="space-y-3">
              <div className="mb-3 flex h-10 items-center justify-center border-b py-2">
                <span className="text-sm font-semibold">{t('Features')}</span>
              </div>
              {allModules.map((module) => (
                <div key={module.module} className="flex h-6 items-center justify-center py-0.5">
                  <span className="text-center text-sm capitalize leading-none">{module.alias}</span>
                </div>
              ))}
            </div>
          </div>

          {activePlans.map((plan) => {
            const enabledCount = allModules.filter((m) => hasModule(plan, m.module)).length

            return (
              <div key={plan.id} className="rounded-2xl border border-border bg-background p-6">
                <div className="space-y-3">
                  <div className="mb-3 flex h-10 items-center justify-center border-b py-2">
                    <span className="text-sm font-semibold">
                      {enabledCount}/{allModules.length} {t('Enabled')}
                    </span>
                  </div>
                  {allModules.map((module) => (
                    <div key={module.module} className="flex h-6 items-center justify-center py-0.5">
                      {hasModule(plan, module.module) ? (
                        <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {!isSuperAdmin ? (
                    <div className="space-y-2 border-t pt-4">
                      <Button className="w-full" size="sm" asChild>
                        <Link to={paths.planSubscribe(plan.id)}>{t('Subscribe to Plan')}</Link>
                      </Button>
                      {plan.trial && plan.trial_days ? (
                        <Button className="w-full" size="sm" variant="outline" asChild>
                          <Link to={paths.planSubscribe(plan.id)}>
                            <Clock className="mr-2 h-4 w-4" />
                            {t('Start Trial')} ({plan.trial_days}d)
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Delete Plan')}</DialogTitle>
            <DialogDescription>
              {t('Are you sure you want to delete')} &quot;{deletingPlan?.name}&quot;?{' '}
              {t('This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPlan(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingPlan && deleteMutation.mutate(deletingPlan.id)}
            >
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PlansIndexPageActions({ canCreate }: { canCreate: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!canCreate) return null

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button size="sm" onClick={() => navigate(paths.planCreate)}>
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('Create')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
