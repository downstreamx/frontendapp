import { Navigate, Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { FaqFormPage } from '@/features/support/pages/FaqFormPage'
import { FaqShowPage } from '@/features/support/pages/FaqShowPage'
import { FaqsIndexPage } from '@/features/support/pages/FaqsIndexPage'
import { KnowledgeBaseFormPage } from '@/features/support/pages/KnowledgeBaseFormPage'
import { KnowledgeBaseIndexPage } from '@/features/support/pages/KnowledgeBaseIndexPage'
import { KnowledgeBaseShowPage } from '@/features/support/pages/KnowledgeBaseShowPage'
import { SupportContactsIndexPage } from '@/features/support/pages/SupportContactsIndexPage'
import { SupportPortalSettingsPage } from '@/features/support/pages/SupportPortalSettingsPage'
import { SupportTicketThreadPage } from '@/features/support/pages/SupportTicketThreadPage'
import { SupportTicketsIndexPage } from '@/features/support/pages/SupportTicketsIndexPage'
import { LeadShowPage } from '@/features/lead/pages/LeadShowPage'
import { LeadFormPage } from '@/features/lead/pages/LeadFormPage'
import { DealShowPage } from '@/features/lead/pages/DealShowPage'
import { DealFormPage } from '@/features/lead/pages/DealFormPage'
import { DealsIndexPage } from '@/features/lead/pages/DealsIndexPage'
import { LeadsIndexPage } from '@/features/lead/pages/LeadsIndexPage'
import { PipelinesIndexPage } from '@/features/lead/pages/PipelinesIndexPage'
import { JobPostingsIndexPage } from '@/features/recruitment/pages/JobPostingsIndexPage'
import { JobPostingFormPage } from '@/features/recruitment/pages/JobPostingFormPage'
import { CandidateShowPage } from '@/features/recruitment/pages/CandidateShowPage'
import { CandidatesIndexPage } from '@/features/recruitment/pages/CandidatesIndexPage'
import { JobPostingShowPage } from '@/features/recruitment/pages/JobPostingShowPage'
import { recruitmentAtsRoutes } from '@/routes/modules/recruitment-ats-routes'
import { recruitmentCmsRoutes } from '@/routes/modules/recruitment-cms-routes'
import { CandidateFormPage } from '@/features/recruitment/pages/CandidateFormPage'
import { ProjectKanbanPage } from '@/features/taskly/pages/ProjectKanbanPage'
import { ProjectViewPage } from '@/features/taskly/pages/ProjectViewPage'
import { ProjectCreateRedirect } from '@/features/taskly/pages/ProjectCreateRedirect'
import { ProjectFormPage } from '@/features/taskly/pages/ProjectFormPage'
import { ProjectsIndexPage } from '@/features/taskly/pages/ProjectsIndexPage'
import { ProjectReportIndexPage } from '@/features/taskly/pages/ProjectReportIndexPage'
import { ProjectReportShowPage } from '@/features/taskly/pages/ProjectReportShowPage'

export const crmRoutes = (
  <>
    <Route path={paths.lead.leads} element={<LeadsIndexPage />} />
    <Route path={paths.lead.leadCreate} element={<LeadFormPage />} />
    <Route path="/lead/leads/:id/edit" element={<LeadFormPage />} />
    <Route path="/lead/leads/:id" element={<LeadShowPage />} />
    <Route path={paths.lead.deals} element={<DealsIndexPage />} />
    <Route path={paths.lead.dealCreate} element={<DealFormPage />} />
    <Route path="/lead/deals/:id/edit" element={<DealFormPage />} />
    <Route path="/lead/deals/:id" element={<DealShowPage />} />
    <Route path={paths.lead.pipelines} element={<PipelinesIndexPage />} />
    <Route path="/lead/*" element={<ModuleIndexPage />} />
    <Route path={paths.taskly.projects} element={<ProjectsIndexPage />} />
    <Route path={paths.taskly.projectCreate} element={<ProjectCreateRedirect />} />
    <Route path="/taskly/projects/:id/edit" element={<ProjectFormPage />} />
    <Route path="/taskly/projects/:id" element={<ProjectViewPage />} />
    <Route path="/taskly/projects/:id/tasks/kanban" element={<ProjectKanbanPage kind="tasks" />} />
    <Route path="/taskly/projects/:id/bugs/kanban" element={<ProjectKanbanPage kind="bugs" />} />
    <Route path="/project/report" element={<ProjectReportIndexPage />} />
    <Route path="/project/report/:id" element={<ProjectReportShowPage />} />
    <Route path="/project/:id" element={<ProjectViewPage />} />
    <Route path="/project/*" element={<ModuleIndexPage />} />
    <Route path="/taskly/*" element={<ModuleIndexPage />} />
    <Route path={paths.support.tickets} element={<SupportTicketsIndexPage />} />
    <Route path={paths.support.ticketCreate} element={<Navigate to={paths.support.tickets} replace />} />
    <Route path="/support/tickets/:id" element={<SupportTicketThreadPage />} />
    <Route path={paths.support.knowledgeBase} element={<KnowledgeBaseIndexPage />} />
    <Route path={paths.support.knowledgeBaseCreate} element={<KnowledgeBaseFormPage />} />
    <Route path="/support/knowledge-base/:id/edit" element={<KnowledgeBaseFormPage />} />
    <Route path="/support/knowledge-base/:id" element={<KnowledgeBaseShowPage />} />
    <Route path={paths.support.faqs} element={<FaqsIndexPage />} />
    <Route path={paths.support.faqCreate} element={<FaqFormPage />} />
    <Route path="/support/faqs/:id/edit" element={<FaqFormPage />} />
    <Route path="/support/faqs/:id" element={<FaqShowPage />} />
    <Route path={paths.support.portalSettings} element={<SupportPortalSettingsPage />} />
    <Route path={paths.support.contacts} element={<SupportContactsIndexPage />} />
    <Route path="/support-ticket/*" element={<ModuleIndexPage />} />
    <Route path={paths.recruitment.jobPostings} element={<JobPostingsIndexPage />} />
    <Route path="/recruitment/job-postings/create" element={<JobPostingFormPage />} />
    <Route path="/recruitment/job-postings/:id/edit" element={<JobPostingFormPage />} />
    <Route path="/recruitment/job-postings/:id" element={<JobPostingShowPage />} />
    <Route path={paths.recruitment.candidates} element={<CandidatesIndexPage />} />
    <Route path="/recruitment/candidates/create" element={<CandidateFormPage />} />
    <Route path="/recruitment/candidates/:id/edit" element={<CandidateFormPage />} />
    <Route path="/recruitment/candidates/:id" element={<CandidateShowPage />} />
    {recruitmentAtsRoutes}
    {recruitmentCmsRoutes}
    <Route path="/recruitment/*" element={<ModuleIndexPage />} />
  </>
)
