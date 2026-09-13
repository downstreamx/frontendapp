import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/lib/paths'
import { integrationProviders } from '@/lib/entity-registry'
import { listIntegrations } from '../integrations-api'
import { cn } from '@/lib/utils'

const LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  slack: 'Slack',
  telegram: 'Telegram',
  twilio: 'Twilio',
  webhook: 'Webhook',
  'zoom-meeting': 'Zoom Meeting',
  'a-i-assistant': 'AI Assistant',
}

export function IntegrationsHubPage() {
  const listQuery = useQuery({ queryKey: ['integrations', 'index'], queryFn: listIntegrations })

  const statusByProvider = new Map(
    (listQuery.data ?? []).map((row) => [row.provider, row.configured]),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect payment, messaging, and automation providers for your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {integrationProviders.map((provider) => {
              const configured = statusByProvider.get(provider)
              return (
                <li key={provider}>
                  <Link
                    to={paths.integration(provider)}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span>{LABELS[provider] ?? provider}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        configured ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {configured === undefined ? '…' : configured ? 'Configured' : 'Not configured'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
