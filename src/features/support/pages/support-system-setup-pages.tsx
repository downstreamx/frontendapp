import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { fetchSupportPortalSettings, updateSupportPortalSettings } from '../support-api'

type SectionBlock = { title: string; description: string }

type TitleSections = {
  create_ticket: SectionBlock
  search_ticket: SectionBlock
  knowledge_base: SectionBlock
  faq: SectionBlock
  contact: SectionBlock
}

type CtaSections = {
  knowledge_base: SectionBlock
  faq: SectionBlock
}

type ContactInformation = {
  map_embed_url: string
  address: string
  phone: string
  email: string
}

const EMPTY_BLOCK: SectionBlock = { title: '', description: '' }

const DEFAULT_TITLE_SECTIONS: TitleSections = {
  create_ticket: { ...EMPTY_BLOCK },
  search_ticket: { ...EMPTY_BLOCK },
  knowledge_base: { ...EMPTY_BLOCK },
  faq: { ...EMPTY_BLOCK },
  contact: { ...EMPTY_BLOCK },
}

const DEFAULT_CTA_SECTIONS: CtaSections = {
  knowledge_base: { ...EMPTY_BLOCK },
  faq: { ...EMPTY_BLOCK },
}

function SettingsSaveCard({
  title,
  children,
  onSave,
  isPending,
}: {
  title: string
  children: React.ReactNode
  onSave: () => void
  isPending: boolean
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{title}</CardTitle>
        <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? t('Saving...') : t('Save Changes')}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SectionFields({
  label,
  block,
  onChange,
}: {
  label: string
  block: SectionBlock
  onChange: (next: SectionBlock) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="text-base font-semibold">{label}</h3>
      <div className="space-y-1">
        <Label>{t('Title')}</Label>
        <Input
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>{t('Description')}</Label>
        <Textarea
          value={block.description}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  )
}


export function SupportContactInformationPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ContactInformation>({
    map_embed_url: '',
    address: '',
    phone: '',
    email: '',
  })

  const query = useQuery({
    queryKey: ['support-ticket', 'settings', 'contact-information'],
    queryFn: () => fetchSupportPortalSettings<ContactInformation>('contact-information'),
  })

  useEffect(() => {
    if (query.data) {
      setForm({
        map_embed_url: query.data.map_embed_url ?? '',
        address: query.data.address ?? '',
        phone: query.data.phone ?? '',
        email: query.data.email ?? '',
      })
    }
  }, [query.data])

  const mutation = useMutation({
    mutationFn: () => updateSupportPortalSettings('contact-information', form),
    onSuccess: () => {
      toast.success(t('Contact information saved'))
      void queryClient.invalidateQueries({
        queryKey: ['support-ticket', 'settings', 'contact-information'],
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <SettingsSaveCard
      title={t('Contact Information')}
      onSave={() => mutation.mutate()}
      isPending={mutation.isPending}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>{t('Google Maps embed')}</Label>
          <Textarea
            value={form.map_embed_url}
            onChange={(e) => setForm((prev) => ({ ...prev, map_embed_url: e.target.value }))}
            rows={4}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>{t('Address')}</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Phone')}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Email')}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </SettingsSaveCard>
  )
}

export function SupportTitleSectionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<TitleSections>(DEFAULT_TITLE_SECTIONS)

  const query = useQuery({
    queryKey: ['support-ticket', 'settings', 'title-sections'],
    queryFn: () => fetchSupportPortalSettings<TitleSections>('title-sections'),
  })

  useEffect(() => {
    if (query.data) {
      setSections({ ...DEFAULT_TITLE_SECTIONS, ...query.data })
    }
  }, [query.data])

  const mutation = useMutation({
    mutationFn: () => updateSupportPortalSettings('title-sections', sections),
    onSuccess: () => {
      toast.success(t('Title sections saved'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'settings', 'title-sections'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  const blocks: { key: keyof TitleSections; label: string }[] = [
    { key: 'create_ticket', label: t('Create Ticket Section') },
    { key: 'search_ticket', label: t('Search Ticket Section') },
    { key: 'knowledge_base', label: t('Knowledge Base Section') },
    { key: 'faq', label: t('FAQ Section') },
    { key: 'contact', label: t('Contact Section') },
  ]

  return (
    <SettingsSaveCard
      title={t('Title Sections')}
      onSave={() => mutation.mutate()}
      isPending={mutation.isPending}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {blocks.map(({ key, label }) => (
          <SectionFields
            key={key}
            label={label}
            block={sections[key]}
            onChange={(next) => setSections((prev) => ({ ...prev, [key]: next }))}
          />
        ))}
      </div>
    </SettingsSaveCard>
  )
}

export function SupportCtaSectionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<CtaSections>(DEFAULT_CTA_SECTIONS)

  const query = useQuery({
    queryKey: ['support-ticket', 'settings', 'cta-sections'],
    queryFn: () => fetchSupportPortalSettings<CtaSections>('cta-sections'),
  })

  useEffect(() => {
    if (query.data) {
      setSections({ ...DEFAULT_CTA_SECTIONS, ...query.data })
    }
  }, [query.data])

  const mutation = useMutation({
    mutationFn: () => updateSupportPortalSettings('cta-sections', sections),
    onSuccess: () => {
      toast.success(t('CTA sections saved'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'settings', 'cta-sections'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <SettingsSaveCard
      title={t('CTA Sections')}
      onSave={() => mutation.mutate()}
      isPending={mutation.isPending}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionFields
          label={t('Knowledge Base CTA')}
          block={sections.knowledge_base}
          onChange={(next) => setSections((prev) => ({ ...prev, knowledge_base: next }))}
        />
        <SectionFields
          label={t('FAQ CTA')}
          block={sections.faq}
          onChange={(next) => setSections((prev) => ({ ...prev, faq: next }))}
        />
      </div>
    </SettingsSaveCard>
  )
}

export function SupportCategoriesInfoPage() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Support Category')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          {t(
            'Support categories are the same ticket categories used when creating tickets and on the public support portal.',
          )}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={paths.support.ticketCategories}>{t('Manage ticket categories')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
