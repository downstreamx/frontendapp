import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppContext } from '@/contexts/app-context'
import { fetchPlanModuleCatalog, listPlans } from '@/features/saas/saas-api'
import { PlansComparisonGrid } from '@/features/plans/components/PlansComparisonGrid'
import { getPackageAlias } from '@/utils/helpers'
import { GenericSettingsSection } from './generic-settings-section'
import type { SettingsSectionProps } from '../types'

export function SubscriptionSettingsSection(props: SettingsSectionProps) {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const isSuperAdmin = auth.user?.type === 'superadmin'

  const listQuery = useQuery({
    queryKey: ['saas', 'plans', 'settings'],
    queryFn: () => listPlans({ per_page: 50 }),
  })

  const modulesQuery = useQuery({
    queryKey: ['saas', 'plan-module-catalog', 'settings'],
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Subscription plans')}</CardTitle>
          <CardDescription>
            {t('Compare plan features and module access. Company users can subscribe from here or from the Plans page.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading || modulesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
          ) : (
            <PlansComparisonGrid
              plans={plans}
              activeModules={activeModules}
              isSuperAdmin={isSuperAdmin}
              canCreate={false}
            />
          )}
        </CardContent>
      </Card>

      {isSuperAdmin ? (
        <GenericSettingsSection
          {...props}
          tab="Subscription"
          title={t('Plan configuration')}
          description={t('Payment methods and trial defaults for platform subscriptions.')}
          icon={Settings}
          editPermission="edit-settings"
        />
      ) : null}
    </div>
  )
}
