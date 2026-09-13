import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/errors'
import { createLeadActivity } from '../lead-api'
import type { LeadDetail } from '../lead-api'

type Props = {
  leadId: number
  activities: LeadDetail['activities']
}

export function LeadActivitySection({ leadId, activities }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [remark, setRemark] = useState('')

  const addMutation = useMutation({
    mutationFn: () => createLeadActivity(leadId, { remark: remark.trim(), log_type: 'Note' }),
    onSuccess: () => {
      toast.success(t('Activity added'))
      setRemark('')
      void queryClient.invalidateQueries({ queryKey: ['lead', String(leadId)] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to add activity'))),
  })

  const items = activities ?? []

  return (
    <div className="space-y-4">
      <form
        className="space-y-2 rounded-md border p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!remark.trim()) return
          addMutation.mutate()
        }}
      >
        <Label>{t('Add note')}</Label>
        <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} />
        <Button type="submit" size="sm" disabled={addMutation.isPending || !remark.trim()}>
          {t('Post')}
        </Button>
      </form>
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">{t('No activity yet.')}</li>
        ) : (
          items.map((item, index) => {
            const user = item.user as { name?: string } | undefined
            const logType = String(item.log_type ?? '')
            const text = String(item.remark ?? '')
            return (
              <li key={String(item.id ?? index)} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{logType || t('Note')}</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{text}</p>
                {user?.name ? (
                  <p className="mt-2 text-xs text-muted-foreground">{user.name}</p>
                ) : null}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
