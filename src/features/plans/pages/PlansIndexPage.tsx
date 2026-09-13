/** Comparison grid layout — not a tabular index; S/N column not applicable. */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { fetchPlanModuleCatalog, listPlans } from '@/features/saas/saas-api'
import { getPackageAlias } from '@/utils/helpers'
import { PlansComparisonGrid, PlansIndexPageActions } from '../components/PlansComparisonGrid'

export function PlansIndexPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const isSuperAdmin = auth.user?.type === 'superadmin'
  const canCreate = isSuperAdmin

  const listQuery = useQuery({
    queryKey: ['saas', 'plans'],
    queryFn: () => listPlans({ per_page: 50 }),
  })

  const modulesQuery = useQuery({
    queryKey: ['saas', 'plan-module-catalog'],
    queryFn: fetchPlanModuleCatalog,
  })

  const plans = listQuery.data ?? []

  const activeModules = useMemo(() => {
    const catalog = (modulesQuery.data ?? []).map((row) => ({
      module: row.module,
      alias: row.alias ?? row.name ?? getPackageAlias(row.module) ?? row.module,
    }))

    if (catalog.length > 0) {
      return catalog
    }

    const moduleNames = new Set(plans.flatMap((plan) => plan.modules ?? []))

    return [...moduleNames]
      .map((module) => ({
        module,
        alias: getPackageAlias(module) ?? module,
      }))
      .sort((a, b) => a.alias.localeCompare(b.alias))
  }, [modulesQuery.data, plans])

  usePageChrome({
    pageTitle: t('Subscription Setting'),
    breadcrumbs: [{ label: t('Subscription Setting') }],
    pageActions: isSuperAdmin ? <PlansIndexPageActions canCreate={canCreate} /> : undefined,
  })

  return (
    <div className="space-y-8">
      {listQuery.isLoading || modulesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
      ) : (
        <PlansComparisonGrid
          plans={plans}
          activeModules={activeModules}
          isSuperAdmin={isSuperAdmin}
          canCreate={canCreate}
        />
      )}
    </div>
  )
}
