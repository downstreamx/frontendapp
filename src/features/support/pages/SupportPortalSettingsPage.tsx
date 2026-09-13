import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import {
  fetchSupportPortalSettings,
  updateSupportPortalSettings,
  type SupportBrandSettings,
  type SupportInformationSettings,
} from '../support-api'

export function SupportPortalSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [titleText, setTitleText] = useState('')
  const [footerText, setFooterText] = useState('')
  const [logoDark, setLogoDark] = useState('')
  const [favicon, setFavicon] = useState('')

  const [responseTime, setResponseTime] = useState('')
  const [phoneSupport, setPhoneSupport] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [closingHours, setClosingHours] = useState('')

  usePageChrome({
    pageTitle: t('Portal settings'),
    breadcrumbs: [{ label: t('Support') }, { label: t('Portal settings') }],
  })

  const brandQuery = useQuery({
    queryKey: ['support-ticket', 'settings', 'brand'],
    queryFn: () => fetchSupportPortalSettings<SupportBrandSettings>('brand'),
  })

  const infoQuery = useQuery({
    queryKey: ['support-ticket', 'settings', 'support-information'],
    queryFn: () => fetchSupportPortalSettings<SupportInformationSettings>('support-information'),
  })

  useEffect(() => {
    const brand = brandQuery.data
    if (!brand) return
    setTitleText(brand.title_text ?? '')
    setFooterText(brand.footer_text ?? '')
    setLogoDark(brand.logo_dark ?? '')
    setFavicon(brand.favicon ?? '')
  }, [brandQuery.data])

  useEffect(() => {
    const info = infoQuery.data
    if (!info) return
    setResponseTime(info.response_time ?? '')
    setPhoneSupport(info.phone_support ?? '')
    setOpeningHours(info.opening_hours ?? '')
    setClosingHours(info.closing_hours ?? '')
  }, [infoQuery.data])

  const brandMutation = useMutation({
    mutationFn: () =>
      updateSupportPortalSettings('brand', {
        title_text: titleText,
        footer_text: footerText,
        logo_dark: logoDark,
        favicon,
      }),
    onSuccess: () => {
      toast.success(t('Brand settings saved'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'settings', 'brand'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save brand settings'))),
  })

  const infoMutation = useMutation({
    mutationFn: () =>
      updateSupportPortalSettings('support-information', {
        response_time: responseTime,
        phone_support: phoneSupport,
        opening_hours: openingHours,
        closing_hours: closingHours,
      }),
    onSuccess: () => {
      toast.success(t('Support information saved'))
      void queryClient.invalidateQueries({
        queryKey: ['support-ticket', 'settings', 'support-information'],
      })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to save support information'))),
  })

  const loading = brandQuery.isLoading || infoQuery.isLoading

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('Portal settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : (
          <Tabs defaultValue="brand">
            <TabsList>
              <TabsTrigger value="brand">{t('Brand')}</TabsTrigger>
              <TabsTrigger value="support-information">{t('Support information')}</TabsTrigger>
            </TabsList>
            <TabsContent value="brand" className="mt-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  brandMutation.mutate()
                }}
              >
                <div className="space-y-1">
                  <Label>{t('Title text')}</Label>
                  <Input value={titleText} onChange={(e) => setTitleText(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Footer text')}</Label>
                  <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Logo (dark)')}</Label>
                  <Input value={logoDark} onChange={(e) => setLogoDark(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Favicon')}</Label>
                  <Input value={favicon} onChange={(e) => setFavicon(e.target.value)} />
                </div>
                <Button type="submit" disabled={brandMutation.isPending}>
                  {t('Save')}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="support-information" className="mt-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  infoMutation.mutate()
                }}
              >
                <div className="space-y-1">
                  <Label>{t('Response time')}</Label>
                  <Textarea
                    value={responseTime}
                    onChange={(e) => setResponseTime(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Phone support')}</Label>
                  <Input value={phoneSupport} onChange={(e) => setPhoneSupport(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Opening hours')}</Label>
                  <Input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Closing hours')}</Label>
                  <Input value={closingHours} onChange={(e) => setClosingHours(e.target.value)} />
                </div>
                <Button type="submit" disabled={infoMutation.isPending}>
                  {t('Save')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
