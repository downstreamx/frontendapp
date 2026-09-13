import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getIntegrationSettings,
  getIntegrationStatus,
  updateIntegrationSettings,
} from '../integrations-api'

type Props = { provider: string }

const SETTING_FIELDS = ['api_key', 'api_secret', 'webhook_url', 'client_id', 'client_secret'] as const

export function IntegrationSettingsPage({ provider }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})

  const statusQuery = useQuery({
    queryKey: ['integration', provider, 'status'],
    queryFn: () => getIntegrationStatus(provider),
  })

  const settingsQuery = useQuery({
    queryKey: ['integration', provider, 'settings'],
    queryFn: () => getIntegrationSettings(provider),
  })

  useEffect(() => {
    const settings = settingsQuery.data?.settings
    if (!settings) return
    const next: Record<string, string> = {}
    for (const key of SETTING_FIELDS) {
      next[key] = settings[key] ?? ''
    }
    setForm(next)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => updateIntegrationSettings(provider, form),
    onSuccess: () => {
      toast.success('Integration settings saved')
      queryClient.invalidateQueries({ queryKey: ['integration', provider] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const title = provider.replace(/-/g, ' ')

  return (
    <Card>
      <CardHeader>
        <Link to={paths.integrationsHub} className="text-sm text-primary hover:underline">
          All integrations
        </Link>
        <CardTitle className="capitalize">{title}</CardTitle>
        <CardDescription>
          Status:{' '}
          {statusQuery.data?.configured ? (
            <span className="text-primary">Configured</span>
          ) : (
            <span className="text-muted-foreground">Not configured</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settingsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <form
          className="space-y-3 max-w-md"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          {SETTING_FIELDS.map((key) => (
            <div key={key} className="space-y-1">
              <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
              <Input
                type={key.includes('secret') ? 'password' : 'text'}
                value={form[key] ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <Button type="submit" size="sm" disabled={saveMutation.isPending}>
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
