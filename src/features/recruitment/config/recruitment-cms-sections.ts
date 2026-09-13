export type RecruitmentCmsSection = {
  key: string
  title: string
  path: string
  permission?: string
  fields?: Array<{ name: string; label: string; type?: 'text' | 'textarea'; required?: boolean }>
  listKey?: string
  listLabel?: string
  listFields?: Array<{ name: string; label: string }>
  listTemplate?: Record<string, string>
}

export const RECRUITMENT_CMS_SECTIONS: RecruitmentCmsSection[] = [
  {
    key: 'brand',
    title: 'Brand settings',
    path: '/recruitment/brand-settings',
    permission: 'manage-recruitment-brand-settings',
    fields: [
      { name: 'title_text', label: 'Title text', required: true },
      { name: 'footer_text', label: 'Footer text', type: 'textarea', required: true },
      { name: 'logo_dark', label: 'Logo path' },
      { name: 'favicon', label: 'Favicon path' },
    ],
  },
  {
    key: 'about-company',
    title: 'About company',
    path: '/recruitment/about-company',
    permission: 'manage-about-company',
    fields: [
      { name: 'our_mission', label: 'Our mission', required: true },
      { name: 'company_size', label: 'Company size', required: true },
      { name: 'industry', label: 'Industry', required: true },
    ],
  },
  {
    key: 'application-tips',
    title: 'Application tips',
    path: '/recruitment/application-tips',
    permission: 'manage-application-tips',
    listKey: 'tips',
    listLabel: 'Tips',
    listFields: [{ name: 'title', label: 'Title' }],
    listTemplate: { title: '' },
  },
  {
    key: 'what-happens-next',
    title: 'What happens next',
    path: '/recruitment/what-happens-next',
    permission: 'manage-what-happens-next',
    listKey: 'steps',
    listLabel: 'Steps',
    listFields: [
      { name: 'title', label: 'Title' },
      { name: 'description', label: 'Description' },
      { name: 'icon', label: 'Icon' },
    ],
    listTemplate: { title: '', description: '', icon: '' },
  },
  {
    key: 'need-help',
    title: 'Need help',
    path: '/recruitment/need-help',
    permission: 'manage-need-help',
    fields: [
      { name: 'description', label: 'Description', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: true },
    ],
  },
  {
    key: 'tracking-faq',
    title: 'Tracking FAQ',
    path: '/recruitment/tracking-faq',
    permission: 'manage-tracking-faq',
    listKey: 'faqs',
    listLabel: 'FAQs',
    listFields: [
      { name: 'question', label: 'Question' },
      { name: 'answer', label: 'Answer' },
    ],
    listTemplate: { question: '', answer: '' },
  },
  {
    key: 'dashboard-welcome-card',
    title: 'Dashboard welcome card',
    path: '/recruitment/dashboard-welcome-card',
    permission: 'manage-recruitment-dashboard-welcome-card',
    fields: [
      { name: 'card_title', label: 'Card title', required: true },
      { name: 'card_description', label: 'Card description', type: 'textarea', required: true },
      { name: 'button_text', label: 'Button text', required: true },
      { name: 'button_icon', label: 'Button icon' },
    ],
  },
]

export function getRecruitmentCmsSection(key: string): RecruitmentCmsSection | undefined {
  return RECRUITMENT_CMS_SECTIONS.find((s) => s.key === key)
}
