import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionInfo } from '@/components/ui/subscription-info'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { useAppContext } from '@/contexts/app-context'
import {
  createPlan,
  fetchPlanModuleCatalog,
  getPlan,
  updatePlan,
  type PlanRow,
} from '@/features/saas/saas-api'
import { formatAdminCurrency, getPackageAlias, getPackageFavicon } from '@/utils/helpers'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export type PlanFormValues = {
  name: string
  description: string
  number_of_users: number
  storage_limit: number
  status: boolean
  free_plan: boolean
  modules: string[]
  package_price_yearly: number
  package_price_monthly: number
  trial: boolean
  trial_days: number
}

const defaultValues: PlanFormValues = {
  name: '',
  description: '',
  number_of_users: 1,
  storage_limit: 0,
  status: true,
  free_plan: false,
  modules: [],
  package_price_yearly: 0,
  package_price_monthly: 0,
  trial: false,
  trial_days: 0,
}

type Props = {
  planId?: number
  isEdit?: boolean
}

export function PlanForm({ planId, isEdit = false }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const isSuperAdmin = auth.user?.type === 'superadmin'

  const [moduleSearch, setModuleSearch] = useState('')
  const [values, setValues] = useState<PlanFormValues>(defaultValues)

  const planQuery = useQuery({
    queryKey: ['saas', 'plans', planId],
    queryFn: () => getPlan(planId!),
    enabled: isEdit && planId != null,
  })

  const modulesQuery = useQuery({
    queryKey: ['saas', 'plan-module-catalog'],
    queryFn: fetchPlanModuleCatalog,
  })

  const activeModules = useMemo(
    () =>
      (modulesQuery.data ?? []).map((row) => ({
        module: row.module,
        alias: row.alias ?? row.name ?? getPackageAlias(row.module) ?? row.module,
        image: row.image,
      })),
    [modulesQuery.data],
  )

  const userSubscriptionInfo = useMemo(
    () => ({
      is_superadmin: isSuperAdmin,
      available_modules_count: activeModules.length,
    }),
    [activeModules.length, isSuperAdmin],
  )

  useEffect(() => {
    const row = planQuery.data
    if (!row) return
    setValues(planRowToFormValues(row))
  }, [planQuery.data])

  const getCurrencySymbol = () => formatAdminCurrency(1).replace(/[\d\s.,]/g, '').trim()

  const filteredModules = activeModules.filter(
    (module) =>
      module.alias.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      module.module.toLowerCase().includes(moduleSearch.toLowerCase()),
  )

  const setField = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleModuleChange = (moduleName: string, checked: boolean) => {
    if (checked) {
      setField('modules', [...values.modules, moduleName])
    } else {
      setField(
        'modules',
        values.modules.filter((m) => m !== moduleName),
      )
    }
  }

  const toggleFilteredModules = () => {
    const moduleKeys = filteredModules.map((m) => m.module)
    const allSelected = filteredModules.every((m) => values.modules.includes(m.module))
    if (allSelected) {
      setField(
        'modules',
        values.modules.filter((m) => !moduleKeys.includes(m)),
      )
    } else {
      setField('modules', [...new Set([...values.modules, ...moduleKeys])])
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...values }
      return isEdit && planId ? updatePlan(planId, payload) : createPlan(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? t('The plan details are updated successfully') : t('The plan has been created successfully'))
      void queryClient.invalidateQueries({ queryKey: ['saas', 'plans'] })
      navigate(paths.plans)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save plan'))),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isEdit && planQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (modulesQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <SubscriptionInfo
            userSubscriptionInfo={userSubscriptionInfo}
            totalModulesCount={activeModules.length}
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('Quick Settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('Active')}</Label>
                <Switch
                  checked={values.status}
                  onCheckedChange={(checked) => setField('status', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('Trial')}</Label>
                <Switch
                  checked={values.trial}
                  onCheckedChange={(checked) => setField('trial', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('Free')}</Label>
                <Switch
                  checked={values.free_plan}
                  onCheckedChange={(checked) => setField('free_plan', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {values.trial ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('Trial Settings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-xs">{t('Trial Days')}</Label>
                  <Input
                    type="number"
                    placeholder={t('Enter trial days')}
                    value={values.trial_days || ''}
                    onChange={(e) => setField('trial_days', parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!values.free_plan ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('Pricing')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">
                    {t('Monthly')} ({getCurrencySymbol()})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('Enter monthly price')}
                    value={values.package_price_monthly || ''}
                    onChange={(e) =>
                      setField('package_price_monthly', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {t('Yearly')} ({getCurrencySymbol()})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('Enter yearly price')}
                    value={values.package_price_yearly || ''}
                    onChange={(e) =>
                      setField('package_price_yearly', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>{t('Plan Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label required>{t('Plan Name')}</Label>
                  <Input
                    placeholder={t('Enter plan name')}
                    value={values.name}
                    onChange={(e) => setField('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Max Users')}</Label>
                  <Input
                    type="number"
                    placeholder={t('Enter max users')}
                    value={values.number_of_users || ''}
                    onChange={(e) =>
                      setField('number_of_users', parseInt(e.target.value, 10) || 0)
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('Note: "-1" for Unlimited')}
                  </p>
                </div>
                <div>
                  <Label>{t('Storage Limit (GB)')}</Label>
                  <Input
                    type="number"
                    placeholder={t('Enter storage limit in GB')}
                    value={values.storage_limit || ''}
                    onChange={(e) =>
                      setField('storage_limit', parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t('Description')}</Label>
                <Textarea
                  placeholder={t('Enter plan description')}
                  value={values.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                {t('Features')}
                <div className="flex items-center gap-2">
                  <Badge>
                    {values.modules.length} {t('selected')}
                  </Badge>
                  {!isSuperAdmin ? (
                    <Badge variant="outline" className="text-xs">
                      {userSubscriptionInfo.available_modules_count} {t('available')}
                    </Badge>
                  ) : null}
                </div>
              </CardTitle>

              {!isSuperAdmin ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t('Subscription Limited')}
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    {t(
                      'Only showing {{count}} modules from your subscription. Contact admin to access more modules.',
                      { count: userSubscriptionInfo.available_modules_count },
                    )}
                  </p>
                </div>
              ) : null}

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder={t('Search...')}
                  />
                </div>
                <Button type="button" variant="outline" onClick={toggleFilteredModules}>
                  {filteredModules.every((m) => values.modules.includes(m.module))
                    ? t('Uncheck All')
                    : t('Check All')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 gap-3 pr-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredModules.map((module) => (
                    <div
                      key={module.module}
                      className="flex items-center gap-3 rounded border p-4 hover:bg-muted/50"
                    >
                      <img
                        src={getPackageFavicon(module.module)}
                        alt=""
                        className="h-8 w-8 rounded border"
                      />
                      <span className="flex-1 truncate text-sm">
                        {getPackageAlias(module.module) ?? module.alias}
                      </span>
                      <Checkbox
                        checked={values.modules.includes(module.module)}
                        onCheckedChange={(checked) =>
                          handleModuleChange(module.module, checked === true)
                        }
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(paths.plans)}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t('Saving...') : isEdit ? t('Update') : t('Create')}
        </Button>
      </div>
    </form>
  )
}

function planRowToFormValues(row: PlanRow): PlanFormValues {
  const storageGb =
    row.storage_limit != null && row.storage_limit > 1024
      ? Math.round(row.storage_limit / (1024 * 1024))
      : Number(row.storage_limit ?? 0)

  return {
    name: row.name,
    description: row.description ?? '',
    number_of_users: row.number_of_users ?? 1,
    storage_limit: storageGb,
    status: row.status !== false,
    free_plan: row.free_plan ?? false,
    modules: row.modules ?? [],
    package_price_yearly: Number(row.package_price_yearly ?? 0),
    package_price_monthly: Number(row.package_price_monthly ?? 0),
    trial: row.trial ?? false,
    trial_days: row.trial_days ?? 0,
  }
}
