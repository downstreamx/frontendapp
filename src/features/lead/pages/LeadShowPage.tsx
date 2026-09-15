import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getLead } from '../api'
import { LeadActivitySection } from '../components/LeadActivitySection'
import { LeadSidebar, type LeadSection } from '../components/LeadSidebar'
import { LeadGeneralSection } from '../components/LeadGeneralSection'
import { LeadListSection } from '../components/LeadListSection'
import { CrmTasksSection } from '../components/CrmTasksSection'
import { CrmCallsSection } from '../components/CrmCallsSection'
import { CrmFilesSection } from '../components/CrmFilesSection'
import { paths } from '@/lib/paths'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function LeadShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [section, setSection] = useState<LeadSection>('general')

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (error || !lead) {
    return <p className="text-sm text-destructive">{t('Lead not found.')}</p>
  }

  const userLeads = lead.userLeads ?? lead.user_leads ?? []

  const sectionTitles: Record<LeadSection, string> = {
    general: t('General'),
    tasks: t('Tasks'),
    users: t('Users'),
    products: t('Products'),
    sources: t('Sources'),
    files: t('Files'),
    calls: t('Calls'),
    activity: t('Activity'),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{lead.name}</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.lead.leadEdit(lead.id)}>{t('Edit')}</Link>
          </Button>
          <Link to={paths.lead.leads} className="text-sm text-primary hover:underline">
            {t('Back to leads')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <LeadSidebar active={section} onChange={setSection} />
        <div>
          {section !== 'general' && (
            <h3 className="text-lg font-medium mb-4">{sectionTitles[section]}</h3>
          )}
          {section === 'general' && <LeadGeneralSection lead={lead} />}
          {section === 'tasks' && (
            <CrmTasksSection kind="lead" entityId={lead.id} tasks={lead.tasks ?? []} />
          )}
          {section === 'users' && (
            <LeadListSection
              title={t('Users')}
              items={userLeads.map((ul) => (ul.user as Record<string, unknown>) ?? ul)}
              labelKeys={['name', 'email']}
            />
          )}
          {section === 'products' && (
            <LeadListSection title={t('Products')} items={[]} />
          )}
          {section === 'sources' && (
            <LeadListSection title={t('Sources')} items={[]} />
          )}
          {section === 'files' && (
            <CrmFilesSection kind="lead" entityId={lead.id} files={lead.files ?? []} />
          )}
          {section === 'calls' && (
            <CrmCallsSection kind="lead" entityId={lead.id} calls={lead.calls ?? []} />
          )}
          {section === 'activity' && (
            <LeadActivitySection leadId={lead.id} activities={lead.activities} />
          )}
        </div>
      </div>
    </div>
  )
}
