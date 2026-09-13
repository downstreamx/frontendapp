import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
import {
  addClients,
  addTeamMembers,
  removeClient,
  removeTeamMember,
  type ProjectMemberOption,
} from '../api'

type Member = { id: number; name: string; email?: string }

type Props = {
  projectId: number
  team: Member[]
  clients: Member[]
  availableTeam?: ProjectMemberOption[]
  availableClients?: ProjectMemberOption[]
  canInviteTeam?: boolean
  canInviteClient?: boolean
  canDeleteTeam?: boolean
  canDeleteClient?: boolean
}

export function ProjectTeamPanel({
  projectId,
  team,
  clients,
  availableTeam = [],
  availableClients = [],
  canInviteTeam,
  canInviteClient,
  canDeleteTeam,
  canDeleteClient,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [clientIds, setClientIds] = useState<string[]>([])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] })

  const teamOptions = availableTeam.map((user) => ({
    value: String(user.id),
    label: user.name,
  }))

  const clientOptions = availableClients.map((user) => ({
    value: String(user.id),
    label: user.name,
  }))

  const addTeamMutation = useMutation({
    mutationFn: () => addTeamMembers(projectId, teamIds.map(Number)),
    onSuccess: () => {
      toast.success(t('Team members added'))
      setTeamIds([])
      invalidate()
    },
    onError: () => toast.error(t('Failed to add team members')),
  })

  const addClientMutation = useMutation({
    mutationFn: () => addClients(projectId, clientIds.map(Number)),
    onSuccess: () => {
      toast.success(t('Clients added'))
      setClientIds([])
      invalidate()
    },
    onError: () => toast.error(t('Failed to add clients')),
  })

  const removeTeamMutation = useMutation({
    mutationFn: (userId: number) => removeTeamMember(projectId, userId),
    onSuccess: () => {
      toast.success(t('Team member removed'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to remove member')),
  })

  const removeClientMutation = useMutation({
    mutationFn: (clientId: number) => removeClient(projectId, clientId),
    onSuccess: () => {
      toast.success(t('Client removed'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to remove client')),
  })

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Team members')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {team.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                <span>{m.name}</span>
                {canDeleteTeam ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTeamMutation.mutate(m.id)}
                  >
                    {t('Remove')}
                  </Button>
                ) : null}
              </li>
            ))}
            {team.length === 0 && <li className="text-muted-foreground">{t('No team members.')}</li>}
          </ul>
          {canInviteTeam && teamOptions.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <MultiSelectEnhanced
                  options={teamOptions}
                  value={teamIds}
                  onValueChange={setTeamIds}
                  placeholder={t('Select users')}
                  searchable
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => addTeamMutation.mutate()}
                disabled={teamIds.length === 0 || addTeamMutation.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('Add')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Clients')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                <span>{c.name}</span>
                {canDeleteClient ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeClientMutation.mutate(c.id)}
                  >
                    {t('Remove')}
                  </Button>
                ) : null}
              </li>
            ))}
            {clients.length === 0 && <li className="text-muted-foreground">{t('No clients.')}</li>}
          </ul>
          {canInviteClient && clientOptions.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <MultiSelectEnhanced
                  options={clientOptions}
                  value={clientIds}
                  onValueChange={setClientIds}
                  placeholder={t('Select clients')}
                  searchable
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => addClientMutation.mutate()}
                disabled={clientIds.length === 0 || addClientMutation.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('Add')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
