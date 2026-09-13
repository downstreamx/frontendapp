export type ConfigSections = {
  sections?: Record<string, Record<string, unknown>>
  section_visibility?: Record<string, boolean>
  section_order?: string[]
  colors?: Record<string, string>
}

export type LandingDraft = {
  company_name: string
  contact_email: string
  contact_phone: string
  contact_address: string
  config: ConfigSections
}

export const DEFAULT_SECTION_ORDER = [
  'header',
  'hero',
  'stats',
  'features',
  'modules',
  'benefits',
  'gallery',
  'cta',
  'pricing',
  'footer',
]

export const DEFAULT_COLORS = {
  primary: '#10b77f',
  secondary: '#059669',
  accent: '#065f46',
}

export function sectionField(
  config: ConfigSections | undefined,
  key: string,
  field: string,
  fallback = '',
): string {
  const value = config?.sections?.[key]?.[field]
  return typeof value === 'string' ? value : fallback
}

export function getSectionData(
  config: ConfigSections,
  key: string,
): Record<string, unknown> {
  return config.sections?.[key] ?? {}
}

export function mergeSection(
  config: ConfigSections,
  key: string,
  updates: Record<string, unknown>,
): ConfigSections {
  return {
    ...config,
    sections: {
      ...(config.sections ?? {}),
      [key]: {
        ...(config.sections?.[key] ?? {}),
        ...updates,
      },
    },
  }
}

export function setSectionVisibility(
  config: ConfigSections,
  key: string,
  visible: boolean,
): ConfigSections {
  return {
    ...config,
    section_visibility: {
      ...(config.section_visibility ?? {}),
      [key]: visible,
    },
  }
}

export function isSectionVisible(config: ConfigSections, key: string): boolean {
  return config.section_visibility?.[key] !== false
}

export function draftFromApi(data: {
  company_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_address?: string | null
  config_sections?: ConfigSections | null
}): LandingDraft {
  const config = (data.config_sections ?? {}) as ConfigSections
  return {
    company_name: data.company_name ?? '',
    contact_email: data.contact_email ?? '',
    contact_phone: data.contact_phone ?? '',
    contact_address: data.contact_address ?? '',
    config: {
      ...config,
      section_order: config.section_order?.length
        ? config.section_order
        : DEFAULT_SECTION_ORDER,
      colors: config.colors ?? DEFAULT_COLORS,
    },
  }
}

export function buildSavePayload(draft: LandingDraft) {
  return {
    company_name: draft.company_name,
    contact_email: draft.contact_email,
    contact_phone: draft.contact_phone,
    contact_address: draft.contact_address,
    config_sections: draft.config,
  }
}
