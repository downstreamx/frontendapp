import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecruitmentCmsSection } from '../config/recruitment-cms-sections'
import { PageContentLoader } from '@/components/ui/page-content-loader'

type Props = {
  section: RecruitmentCmsSection
}

export function RecruitmentCmsSettingsPage({ section }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['recruitment', 'settings', section.key],
    queryFn: async () => {
      const res = await api.get<{ data: Record<string, unknown> }>(
        `/recruitment/settings/${section.key}`,
      )
      return res.data.data
    },
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/recruitment/settings/${section.key}`, form)
      return res.data.data
    },
    onSuccess: (saved) => {
      setForm(saved as Record<string, unknown>)
      queryClient.setQueryData(['recruitment', 'settings', section.key], saved)
      toast.success(t('Settings saved'))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save settings'))),
  })

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateListItem = (
    listKey: string,
    index: number,
    field: string,
    value: string,
  ) => {
    const list = [...((form[listKey] as Array<Record<string, string>>) ?? [])]
    list[index] = { ...list[index], [field]: value }
    setField(listKey, list)
  }

  const addListItem = (listKey: string, template: Record<string, string>) => {
    const list = [...((form[listKey] as Array<Record<string, string>>) ?? []), template]
    setField(listKey, list)
  }

  const removeListItem = (listKey: string, index: number) => {
    const list = [...((form[listKey] as Array<Record<string, string>>) ?? [])]
    list.splice(index, 1)
    setField(listKey, list.length ? list : [section.listTemplate ?? {}])
  }

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(section.title)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          {section.fields?.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label>{t(field.label)}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  value={String(form[field.name] ?? '')}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required={field.required}
                />
              ) : (
                <Input
                  value={String(form[field.name] ?? '')}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}

          {section.listKey && section.listFields && (
            <div className="space-y-3">
              <Label>{t(section.listLabel ?? 'Items')}</Label>
              {((form[section.listKey] as Array<Record<string, string>>) ?? []).map(
                (row, index) => (
                  <div key={index} className="flex gap-2 items-start border rounded-md p-3">
                    <div className="flex-1 space-y-2">
                      {section.listFields!.map((lf) => (
                        <Input
                          key={lf.name}
                          placeholder={t(lf.label)}
                          value={row[lf.name] ?? ''}
                          onChange={(e) =>
                            updateListItem(section.listKey!, index, lf.name, e.target.value)
                          }
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem(section.listKey!, index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem(section.listKey!, section.listTemplate ?? {})}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('Add item')}
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('Saving…') : t('Save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
