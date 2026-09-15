import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { InputError } from '@/components/ui/input-error'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage, mapApiValidationErrors } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { RolePermissionMatrix } from '../components/RolePermissionMatrix'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  createRole,
  fetchRoleCreateMeta,
  fetchRoleForEdit,
  updateRole,
  type GroupedRolePermissions,
} from '../admin-api'

type FormState = {
  name: string
  label: string
  permissions: string[]
}

const emptyForm: FormState = {
  name: '',
  label: '',
  permissions: [],
}

export function RoleFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nameLocked, setNameLocked] = useState(false)

  usePageChrome({
    pageTitle: isEdit ? t('Edit Role') : t('Create New Role'),
    breadcrumbs: [
      { label: t('Roles'), url: paths.roles.index },
      { label: isEdit ? t('Edit Role') : t('Create Role') },
    ],
  })

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['roles', 'create-meta'],
    queryFn: fetchRoleCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['roles', id, 'edit'],
    queryFn: () => fetchRoleForEdit(id!),
    enabled: isEdit,
  })

  const permissions: GroupedRolePermissions =
    (isEdit ? editMeta?.permissions : createMeta?.permissions) ?? {}

  useEffect(() => {
    if (!isEdit || !editMeta) return
    setForm({
      name: editMeta.role.name,
      label: editMeta.role.label,
      permissions: editMeta.role_permissions,
    })
    setNameLocked(!editMeta.role.editable)
  }, [editMeta, isEdit])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        label: form.label,
        permissions: form.permissions,
      }
      if (isEdit) {
        return updateRole(id!, payload)
      }
      return createRole(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? t('The role details are updated successfully.') : t('The role has been created successfully.'))
      navigate(paths.roles.index)
    },
    onError: (error) => {
      const fieldErrors = mapApiValidationErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      }
      toast.error(getApiErrorMessage(error, isEdit ? t('Failed to update role') : t('Failed to create role')))
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = t('Name is required')
    if (!form.label.trim()) nextErrors.label = t('Label is required')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    saveMutation.mutate()
  }

  const isLoading = isEdit ? editLoading : createLoading

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">{t('Name')}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('Enter role name')}
                disabled={nameLocked}
                required
              />
              <InputError message={errors.name} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="label">{t('Label')}</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder={t('Enter role label')}
                required
              />
              <InputError message={errors.label} />
            </div>
          </div>

          <RolePermissionMatrix
            permissions={permissions}
            selected={form.permissions}
            onChange={(permissions) => setForm((prev) => ({ ...prev, permissions }))}
          />
          <InputError message={errors.permissions} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(paths.roles.index)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? isEdit
                  ? t('Updating...')
                  : t('Creating...')
                : isEdit
                  ? t('Update')
                  : t('Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
