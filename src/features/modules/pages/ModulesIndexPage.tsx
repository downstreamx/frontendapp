/** Card grid for add-on modules — not a tabular index; S/N column not applicable. */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Eye, Package, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NoRecordsFound } from '@/components/no-records-found'
import { SearchInput } from '@/components/ui/search-input'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { getPackageAlias, getPackageFavicon } from '@/utils/helpers'
import { fetchAddOnModules, toggleAddOnModule, type AddOnModuleRow } from '../modules-api'

export function ModulesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canManage =
    auth.user?.type === 'superadmin' ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-add-on')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModule, setSelectedModule] = useState<AddOnModuleRow | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const listQuery = useQuery({
    queryKey: ['add-ons'],
    queryFn: fetchAddOnModules,
  })

  usePageChrome({
    pageTitle: t('Add-ons Manager'),
    breadcrumbs: [{ label: t('Add-ons') }],
  })

  const filteredModules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (listQuery.data ?? []).filter((module) => {
      if (module.display === false) return false
      if (!term) return true
      return (
        module.alias.toLowerCase().includes(term) ||
        module.description.toLowerCase().includes(term) ||
        module.name.toLowerCase().includes(term)
      )
    })
  }, [listQuery.data, searchTerm])

  const toggleMutation = useMutation({
    mutationFn: (module: string) => toggleAddOnModule(module),
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.setQueryData(['add-ons'], result.modules)
      void queryClient.invalidateQueries({ queryKey: ['saas', 'modules'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update module'))),
  })

  const handleToggle = (module: AddOnModuleRow) => {
    if (!canManage) {
      toast.error(t('Permission denied'))
      return
    }
    toggleMutation.mutate(module.name)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={() => undefined}
          placeholder={t('Search add-ons...')}
          className="w-full"
        />
      </CardHeader>
      <CardContent>
        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {filteredModules.map((module) => (
              <Card
                key={module.name}
                className="flex flex-col border shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <img
                      src={getPackageFavicon(module.name) ?? module.image}
                      alt={getPackageAlias(module.name) ?? module.alias}
                      className="h-10 w-10 rounded-lg object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="whitespace-nowrap text-xs font-medium text-green-600">
                        v{parseFloat(module.version).toFixed(1)}
                      </span>
                      <span
                        className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${
                          module.is_enabled
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {module.is_enabled ? t('Active') : t('Inactive')}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
                    {getPackageAlias(module.name) ?? module.alias}
                  </h3>
                  <p className="mb-4 line-clamp-2 flex-1 text-xs text-muted-foreground">
                    {module.description || '—'}
                  </p>

                  <div className="mt-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() => {
                        setSelectedModule(module)
                        setDetailsOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('Details')}
                    </Button>
                    {canManage && (
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-8 px-2 ${
                                module.is_enabled
                                  ? 'border-red-200 bg-red-50 hover:bg-red-100'
                                  : 'border-green-200 bg-green-50 hover:bg-green-100'
                              }`}
                              disabled={toggleMutation.isPending}
                              onClick={() => handleToggle(module)}
                            >
                              {module.is_enabled ? (
                                <PowerOff className="h-3 w-3 text-red-600" />
                              ) : (
                                <Power className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{module.is_enabled ? t('Disable Module') : t('Enable Module')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <NoRecordsFound
            icon={Package}
            title={t('No add-ons found')}
            description={
              searchTerm
                ? t('No add-ons match your search criteria.')
                : t('No add-ons are available.')
            }
            hasFilters={Boolean(searchTerm)}
            onClearFilters={() => setSearchTerm('')}
          />
        )}
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src={selectedModule ? getPackageFavicon(selectedModule.name) : undefined}
                alt=""
                className="h-8 w-8 rounded object-contain"
              />
              {selectedModule ? (getPackageAlias(selectedModule.name) ?? selectedModule.alias) : ''}
            </DialogTitle>
            <DialogDescription>{selectedModule?.description}</DialogDescription>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-muted-foreground">{t('Version')}</span>
                  <p className="font-medium text-green-600">v{selectedModule.version}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">{t('Status')}</span>
                  <p
                    className={
                      selectedModule.is_enabled ? 'font-medium text-green-600' : 'text-muted-foreground'
                    }
                  >
                    {selectedModule.is_enabled ? t('Active') : t('Inactive')}
                  </p>
                </div>
              </div>
              {selectedModule.package_name && (
                <div>
                  <span className="font-medium text-muted-foreground">{t('Package')}</span>
                  <p>{selectedModule.package_name}</p>
                </div>
              )}
              {(selectedModule.parent_module?.length ?? 0) > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">{t('Requires')}</span>
                  <p>{selectedModule.parent_module?.join(', ')}</p>
                </div>
              )}
              {canManage && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={toggleMutation.isPending}
                  onClick={() => {
                    handleToggle(selectedModule)
                    setDetailsOpen(false)
                  }}
                >
                  {selectedModule.is_enabled ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      {t('Disable')}
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      {t('Enable')}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
