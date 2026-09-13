import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { getSystemSetupModuleForPath } from '@/lib/system-setup-registry'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import { getSystemSetupModule, type SystemSetupItem } from '@/lib/system-setup-registry'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'

type Props = {
  moduleKey: string
  itemKey: string
  fields?: CrudFieldDef[]
  permissions?: {
    create?: string
    edit?: string
    delete?: string
  }
  description?: string
}

function resolveItem(moduleKey: string, itemKey: string): SystemSetupItem | undefined {
  return getSystemSetupModule(moduleKey)?.items.find((i) => i.key === itemKey)
}

export function SystemSetupEntityPage({
  moduleKey,
  itemKey,
  fields,
  permissions,
  description,
}: Props) {
  const { t } = useTranslation()
  const item = resolveItem(moduleKey, itemKey)

  if (!item) {
    return null
  }

  const resolvedFields =
    fields ??
    (item.labelKeys?.includes('color')
      ? [
          { name: 'name', label: t('Name'), required: true },
          { name: 'color', label: t('Color'), type: 'color' as const, required: true },
        ]
      : [{ name: 'name', label: t('Name'), required: true }])

  const defaultFieldValues = item.labelKeys?.includes('color') ? { color: '#FF6B6B' } : undefined

  const resolvedPermissions = permissions ?? {
    create: item.permission,
    edit: item.permission?.replace('manage-', 'edit-'),
    delete: item.permission?.replace('manage-', 'delete-'),
  }

  return (
    <ResourceIndexPage
      title={item.title}
      listKey={item.key}
      apiEndpoint={item.apiBase}
      labelKeys={item.labelKeys ?? ['name', 'id']}
      description={description}
      emptyIcon={item.icon}
      fields={resolvedFields}
      defaultFieldValues={defaultFieldValues}
      permissions={resolvedPermissions}
    />
  )
}

/** Resolves setup entity from current pathname via registry. */
export function SystemSetupEntityPageFromPath() {
  const { pathname } = useLocation()
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const module = getSystemSetupModuleForPath(normalized)
  const item = module?.items.find((i) => i.path === normalized)
  if (!module || !item) return null
  return <SystemSetupEntityPage moduleKey={module.key} itemKey={item.key} />
}
