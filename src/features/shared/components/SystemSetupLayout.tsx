import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { usePageChrome } from '@/contexts/page-chrome-context'
import {
  canAccessSystemSetupItem,
  getSystemSetupModule,
  type SystemSetupModule,
} from '@/lib/system-setup-registry'
import { SystemSetupSidebar } from './SystemSetupSidebar'

type Props = {
  moduleKey: string
  children: React.ReactNode
}

export function SystemSetupLayout({ moduleKey, children }: Props) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { auth } = useAppContext()
  const module = getSystemSetupModule(moduleKey)
  const items =
    module?.items.filter((item) =>
      canAccessSystemSetupItem(auth.permissions, auth.roles, auth.user?.type, item),
    ) ?? []

  const activeItem = items.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )

  const showSidebar = items.length > 1

  const pageChrome = useMemo(
    () => ({
      pageTitle: t('System Setup'),
      breadcrumbs: module
        ? [
            ...(module.parentLabel && module.parentPath
              ? [{ label: t(module.parentLabel), url: module.parentPath }]
              : [{ label: t(module.title.replace(/ system setup$/i, '')) }]),
            { label: t('System Setup') },
            ...(activeItem ? [{ label: t(activeItem.label) }] : []),
          ]
        : undefined,
    }),
    [module, activeItem?.label, t],
  )

  usePageChrome(pageChrome)

  if (!module || items.length === 0) {
    return <>{children}</>
  }

  if (!showSidebar) {
    return <div className="min-w-0">{children}</div>
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <SystemSetupSidebar items={items} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** @deprecated use moduleKey string */
export function SystemSetupLayoutFromModule({
  module,
  children,
}: {
  module: SystemSetupModule
  children: React.ReactNode
}) {
  return <SystemSetupLayout moduleKey={module.key}>{children}</SystemSetupLayout>
}
