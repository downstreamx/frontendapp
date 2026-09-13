import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import {
  checkoutSubscription,
  fetchPlanModuleCatalog,
  getPlan,
  getSubscription,
} from '@/features/saas/saas-api'
import { formatAdminCurrency, formatStorage, getPackageAlias } from '@/utils/helpers'

type PaymentMethod = 'bank_transfer' | 'stripe' | 'paypal'

export function SubscribePlanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { planId = '' } = useParams<{ planId: string }>()
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const planQuery = useQuery({
    queryKey: ['saas', 'plans', planId],
    queryFn: () => getPlan(planId),
    enabled: Boolean(planId),
  })

  const subscriptionQuery = useQuery({
    queryKey: ['saas', 'subscription'],
    queryFn: getSubscription,
  })

  const modulesQuery = useQuery({
    queryKey: ['saas', 'plan-module-catalog'],
    queryFn: fetchPlanModuleCatalog,
  })

  const plan = planQuery.data
  const paymentOptions = subscriptionQuery.data?.payment_options

  usePageChrome({
    pageTitle: plan ? `${t('Subscribe to')} ${plan.name}` : t('Subscribe to Plan'),
    breadcrumbs: [
      { label: t('Plans'), url: paths.plans },
      { label: plan ? `${t('Subscribe to')} ${plan.name}` : t('Subscribe to Plan') },
    ],
  })

  const enabledModules = useMemo(() => {
    const planModules = plan?.modules ?? []
    if (planModules.length === 0) return []

    const catalogByModule = new Map(
      (modulesQuery.data ?? []).map((row) => [
        row.module,
        row.alias ?? row.name ?? getPackageAlias(row.module) ?? row.module,
      ]),
    )

    return planModules
      .map((module) => ({
        module,
        alias: catalogByModule.get(module) ?? getPackageAlias(module) ?? module,
      }))
      .sort((a, b) => a.alias.localeCompare(b.alias))
  }, [modulesQuery.data, plan?.modules])

  const subtotal = useMemo(() => {
    if (!plan || plan.free_plan) return 0
    return pricingPeriod === 'monthly'
      ? Number(plan.package_price_monthly ?? 0)
      : Number(plan.package_price_yearly ?? 0)
  }, [plan, pricingPeriod])

  const availableMethods = useMemo(() => {
    const options: Array<{ value: PaymentMethod; label: string }> = []
    if (paymentOptions?.bank_transfer) {
      options.push({ value: 'bank_transfer', label: t('Bank transfer') })
    }
    if (paymentOptions?.stripe) options.push({ value: 'stripe', label: 'Stripe' })
    if (paymentOptions?.paypal) options.push({ value: 'paypal', label: 'PayPal' })
    return options
  }, [paymentOptions, t])

  useEffect(() => {
    if (availableMethods.length === 0) return
    if (availableMethods.some((method) => method.value === paymentMethod)) return
    setPaymentMethod(availableMethods[0].value)
  }, [availableMethods, paymentMethod])

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error('Plan not found')
      if (paymentMethod === 'bank_transfer' && !receiptFile) {
        throw new Error(t('Please upload payment receipt'))
      }
      return checkoutSubscription(plan.id, paymentMethod, {
        time_period: pricingPeriod === 'monthly' ? 'Month' : 'Year',
        user_module_input: (plan.modules ?? []).join(','),
        receipt: paymentMethod === 'bank_transfer' ? receiptFile : null,
      })
    },
    onSuccess: (data) => {
      toast.success(data.message ?? t('Checkout initiated'))
      void queryClient.invalidateQueries({ queryKey: ['saas', 'subscription'] })
      navigate(paths.plans)
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message) {
        toast.error(error.message)
        return
      }
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message
        toast.error(message || t('Checkout failed'))
        return
      }
      toast.error(t('Checkout failed'))
    },
  })

  if (planQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          {t('Plan not found.')}{' '}
          <Link to={paths.plans} className="text-primary hover:underline">
            {t('Back to plans')}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={paths.plans}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to plans')}
        </Link>
      </Button>

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('Plan Details')}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Users')}</span>
                <span className="font-medium">
                  {plan.number_of_users === -1
                    ? t('Unlimited users')
                    : `${plan.number_of_users ?? 0} ${t('users')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Storage')}</span>
                <span className="font-medium">{formatStorage(plan.storage_limit ?? 0)}</span>
              </div>
              {plan.trial ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Trial')}</span>
                  <span className="font-medium">
                    {plan.trial_days} {t('days')}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Available Modules')}</CardTitle>
            </CardHeader>
            <CardContent>
              {enabledModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No modules included in this plan.')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {enabledModules.map((module) => (
                    <div
                      key={module.module}
                      className="flex items-center gap-2 rounded-md border p-3 text-sm"
                    >
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                      <span className="capitalize">{module.alias}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('Subscribe to Plan')}</CardTitle>
            <CardDescription>
              {plan.free_plan
                ? t('This plan is free.')
                : `${formatAdminCurrency(subtotal)} / ${pricingPeriod === 'monthly' ? t('mo') : t('yr')}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {availableMethods.length > 0 ? (
              <div className="space-y-3">
                <Label>{t('Payment Method')}</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  {availableMethods.map((method) => (
                    <div
                      key={method.value}
                      className="flex items-center space-x-3 rounded-lg border p-3"
                    >
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Label htmlFor={method.value} className="cursor-pointer font-medium">
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('No payment methods available. Enable bank transfer or configure Stripe/PayPal in Settings.')}
              </p>
            )}

            {paymentMethod === 'bank_transfer' && paymentOptions?.bank_transfer_instructions ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                <p className="mb-1 font-medium">{t('Bank transfer instructions')}</p>
                {paymentOptions.bank_transfer_instructions}
              </div>
            ) : null}

            {paymentMethod === 'bank_transfer' &&
            availableMethods.some((method) => method.value === 'bank_transfer') ? (
              <div className="space-y-1">
                <Label htmlFor="subscription-receipt">{t('Upload Payment Receipt')}</Label>
                <Input
                  id="subscription-receipt"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                />
                {receiptFile ? (
                  <p className="text-xs text-green-600">{receiptFile.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('Attach your transfer receipt after completing payment.')}
                  </p>
                )}
              </div>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={availableMethods.length === 0 || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending
                ? t('Submitting…')
                : `${t('Subscribe to Plan')} - ${formatAdminCurrency(subtotal)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
