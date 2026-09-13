import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getPackageAlias } from '@/utils/helpers'
import type { GroupedRolePermissions, RolePermissionItem } from '../admin-api'
import {
  filterPermissionAddOns,
  getModuleCheckState,
  toggleModulePermissions,
  togglePermission,
} from '../role-permission-utils'

type Props = {
  permissions: GroupedRolePermissions
  selected: string[]
  onChange: (permissions: string[]) => void
}

function ModulePermissionBlock({
  module,
  modulePermissions,
  selected,
  onChange,
}: {
  module: string
  modulePermissions: RolePermissionItem[]
  selected: string[]
  onChange: (permissions: string[]) => void
}) {
  const moduleState = getModuleCheckState(modulePermissions, selected)

  return (
    <div className="rounded border p-4">
      <div className="mb-3 flex items-center space-x-2">
        <Checkbox
          id={`module-${module}`}
          checked={moduleState.indeterminate ? 'indeterminate' : moduleState.checked}
          onCheckedChange={(checked) =>
            onChange(toggleModulePermissions(modulePermissions, selected, checked === true))
          }
        />
        <Label htmlFor={`module-${module}`} className="font-medium capitalize">
          {module}
        </Label>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {modulePermissions.map((permission) => (
          <div key={permission.name} className="flex items-center space-x-2">
            <Checkbox
              id={permission.name}
              checked={selected.includes(permission.name)}
              onCheckedChange={(checked) =>
                onChange(togglePermission(permission.name, selected, checked === true))
              }
            />
            <Label htmlFor={permission.name} className="text-sm font-normal">
              {permission.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RolePermissionMatrix({ permissions, selected, onChange }: Props) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const labelForAddOn = (addOn: string) => getPackageAlias(addOn) ?? addOn

  const filteredFeatures = useMemo(
    () => filterPermissionAddOns(permissions, searchTerm, labelForAddOn),
    [permissions, searchTerm],
  )

  const defaultTab = filteredFeatures[0] ?? 'general'

  if (Object.keys(permissions).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('No permissions available to assign.')}</p>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('Search features...')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      {filteredFeatures.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('No features match your search.')}</p>
      ) : (
        <Tabs defaultValue={defaultTab} key={defaultTab} className="mt-2">
          <TabsList className="mb-3 h-auto w-full justify-start overflow-x-auto overflow-y-hidden p-1">
            {filteredFeatures.map((addOn) => (
              <TabsTrigger
                key={addOn}
                value={addOn}
                className="flex-shrink-0 whitespace-nowrap capitalize"
              >
                {labelForAddOn(addOn)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Label>{t('Permissions')}</Label>
          {filteredFeatures.map((addOn) => {
            const modules = permissions[addOn]
            return (
              <TabsContent key={addOn} value={addOn}>
                <div className="space-y-3">
                  {Object.entries(modules).map(([module, modulePermissions]) => (
                    <ModulePermissionBlock
                      key={module}
                      module={module}
                      modulePermissions={modulePermissions}
                      selected={selected}
                      onChange={onChange}
                    />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
