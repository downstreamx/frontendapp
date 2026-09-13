export type SettingsPayload = {
  tabs: string[]
  groups: Record<string, Record<string, string>>
  settings: Record<string, string>
  cache_size_mb?: string
}

export type SettingsSectionProps = {
  tab: string
}
