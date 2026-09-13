import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { Label } from '@/components/ui/label'
import { paths } from '@/lib/paths'
import { checkoutSubscription, getSubscription, listPlans } from '../saas-api'

type PaymentMethod = 'bank_transfer' | 'stripe' | 'paypal'

export function SubscriptionIndexPage() {
  const queryClient = useQueryClient()
  const [planId, setPlanId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')

  const subscriptionQuery = useQuery({ queryKey: ['saas', 'subscription'], queryFn: getSubscription })
  const plansQuery = useQuery({
    queryKey: ['saas', 'plans'],
    queryFn: () => listPlans(),
  })

  const sub = subscriptionQuery.data
  const options = sub?.payment_options

  useEffect(() => {
    if (!options) return
    if (options.bank_transfer) setPaymentMethod('bank_transfer')
    else if (options.stripe) setPaymentMethod('stripe')
    else if (options.paypal) setPaymentMethod('paypal')
  }, [options?.bank_transfer, options?.stripe, options?.paypal])

  const planOptions = (plansQuery.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
  }))

  const paymentOptions = [
    options?.bank_transfer ? { value: 'bank_transfer', label: 'Bank transfer' } : null,
    options?.stripe ? { value: 'stripe', label: 'Stripe' } : null,
    options?.paypal ? { value: 'paypal', label: 'PayPal' } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>

  const checkoutMutation = useMutation({
    mutationFn: () =>
      checkoutSubscription(Number(planId), paymentMethod as PaymentMethod),
    onSuccess: (data) => {
      toast.success(data.message ?? 'Checkout initiated')
      queryClient.invalidateQueries({ queryKey: ['saas', 'subscription'] })
      if (data.order?.id) {
        queryClient.invalidateQueries({ queryKey: ['saas', 'orders'] })
      }
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message
        toast.error(message || 'Checkout failed')
        return
      }
      toast.error('Checkout failed')
    },
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Your current plan and module entitlements.{' '}
            <Link to={paths.billing} className="text-primary hover:underline">
              Billing overview
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Status: <span className="font-medium">{sub?.active ? 'Active' : 'Inactive'}</span>
          </p>
          {sub?.plan ? (
            <p>
              Plan: <span className="font-medium">{sub.plan.name}</span>
              {sub.plan.package_price_monthly != null ? ` · $${sub.plan.package_price_monthly}/mo` : ''}
            </p>
          ) : (
            <p className="text-muted-foreground">No plan assigned.</p>
          )}
          {sub?.active_modules && sub.active_modules.length > 0 ? (
            <p>Active modules: {sub.active_modules.join(', ')}</p>
          ) : null}
          <Link to={paths.modules} className="text-primary hover:underline">
            Manage modules
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change plan</CardTitle>
          <CardDescription>Select a plan and payment method to create a subscription order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <EntitySelect
                value={planId}
                onValueChange={setPlanId}
                options={planOptions}
                placeholder="Select plan"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <EntitySelect
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                options={paymentOptions}
                placeholder="Select payment method"
                disabled={paymentOptions.length === 0}
              />
              {paymentOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Enable bank transfer in Settings → Payment or configure Stripe/PayPal under Integrations.
                </p>
              )}
            </div>
          </div>

          {paymentMethod === 'bank_transfer' && options?.bank_transfer_instructions && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              <p className="font-medium mb-1">Bank transfer instructions</p>
              {options.bank_transfer_instructions}
            </div>
          )}

          <Button
            type="button"
            disabled={!planId || checkoutMutation.isPending || paymentOptions.length === 0}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? 'Processing…' : 'Create order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
