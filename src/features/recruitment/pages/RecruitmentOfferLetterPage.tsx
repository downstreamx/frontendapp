import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type OfferLetterPayload = {
  templates: Record<string, string>
  languages: Record<string, { name: string; countryCode: string }>
}

export function RecruitmentOfferLetterPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [lang, setLang] = useState('en')
  const [content, setContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['recruitment', 'offer-letter-templates'],
    queryFn: async () => {
      const res = await api.get<{ data: OfferLetterPayload }>('/recruitment/offer-letter-templates')
      return res.data.data
    },
  })

  useEffect(() => {
    if (data?.templates) {
      const firstLang = Object.keys(data.templates)[0] ?? 'en'
      setLang((current) => (data.templates[current] !== undefined ? current : firstLang))
    }
  }, [data])

  useEffect(() => {
    if (data?.templates) {
      setContent(data.templates[lang] ?? '')
    }
  }, [data, lang])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const templates = { ...(data?.templates ?? {}), [lang]: content }
      const res = await api.put('/recruitment/offer-letter-templates', { templates })
      return res.data.data as OfferLetterPayload
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['recruitment', 'offer-letter-templates'], saved)
      toast.success(t('Offer letter template saved'))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save template'))),
  })

  if (isLoading || !data) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  const languages = Object.entries(data.languages)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Offer letter template')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 max-w-xs">
          <Label>{t('Language')}</Label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(([code, meta]) => (
                <SelectItem key={code} value={code}>
                  {meta.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t('Template content')}</Label>
          <Textarea
            className="min-h-[320px] font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t('Saving…') : t('Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
