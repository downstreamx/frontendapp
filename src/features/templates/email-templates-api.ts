import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type EmailTemplateRow = {
  id: number
  name: string
  from?: string
  module_name?: string
  languages?: Array<{ id: number; lang: string; subject?: string }>
}

export type EmailTemplateIndexMeta = {
  modules: string[]
  languages: Array<{ code: string; name: string }>
}

export type EmailTemplateEditPayload = {
  template: EmailTemplateRow
  lang: string
  content: {
    lang: string
    subject: string
    content: string
    variables: Record<string, string>
    persisted?: boolean
  }
  languages: Array<{ code: string; name: string }>
}

export async function fetchEmailTemplatesIndexMeta() {
  const { data } = await api.get<ApiSuccess<EmailTemplateIndexMeta>>('/email-templates/index-meta')
  return data.data
}

export async function listEmailTemplatesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmailTemplateRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/email-templates', { params })
  return extractPaginatedList<EmailTemplateRow>(data)
}

export async function fetchEmailTemplateForEdit(id: number, lang: string) {
  const { data } = await api.get<ApiSuccess<EmailTemplateEditPayload>>(`/email-templates/${id}`, {
    params: { lang },
  })
  return data.data
}

export async function fetchEmailTemplateLanguage(id: number, lang: string) {
  const { data } = await api.get<
    ApiSuccess<{
      lang: string
      subject: string
      content: string
      variables: Record<string, string>
      persisted?: boolean
    }>
  >(`/email-templates/${id}/languages/${lang}`)
  return data.data
}

export async function updateEmailTemplateContent(
  id: number,
  payload: { lang: string; subject: string; content: string },
) {
  const { data } = await api.put<
    ApiSuccess<{ lang: string; subject: string; content: string; variables: Record<string, string> }>
  >(`/email-templates/${id}`, payload)
  return data.data
}

export async function updateEmailTemplateMeta(id: number, payload: { from: string }) {
  const { data } = await api.put<ApiSuccess<EmailTemplateRow>>(`/email-templates/${id}/meta`, payload)
  return data.data
}
