import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { useMeQuery } from '@/features/auth/hooks'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

type DayKey = (typeof DAY_KEYS)[number]

export function HrmWorkingDaysPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const permissions = me?.permissions ?? []
  const roles = me?.roles ?? []
  const canEdit = hasPermission(permissions, roles, me?.type, 'edit-working-days')

  const { data, isLoading } = useQuery({
    queryKey: ['hrm', 'working-days'],
    queryFn: async () => {
      const res = await api.get<{ data: { working_days: string[] } }>('/hrm/working-days')
      return res.data.data.working_days ?? []
    },
  })

  const [selected, setSelected] = useState<DayKey[]>([])

  useEffect(() => {
    if (data) {
      setSelected(data.filter((d): d is DayKey => DAY_KEYS.includes(d as DayKey)))
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (working_days: DayKey[]) => {
      await api.put('/hrm/working-days', { working_days })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrm', 'working-days'] })
      toast.success(t('Working days updated successfully.'))
    },
    onError: () => toast.error(t('Failed to update working days.')),
  })

  const toggleDay = (day: DayKey, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)))
  }

  const dayLabels: Record<DayKey, string> = {
    monday: t('Monday'),
    tuesday: t('Tuesday'),
    wednesday: t('Wednesday'),
    thursday: t('Thursday'),
    friday: t('Friday'),
    saturday: t('Saturday'),
    sunday: t('Sunday'),
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('Working Days')}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('Select the days of the week that are considered working days for your organization.')}
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate(selected)
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAY_KEYS.map((day) => (
                <div
                  key={day}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={day}
                    checked={selected.includes(day)}
                    onCheckedChange={(checked) => toggleDay(day, checked === true)}
                    disabled={!canEdit}
                  />
                  <Label htmlFor={day} className="cursor-pointer font-normal">
                    {dayLabels[day]}
                  </Label>
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={saveMutation.isPending || selected.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('Save')}
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}
