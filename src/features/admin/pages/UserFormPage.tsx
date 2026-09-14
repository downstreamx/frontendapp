import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  createUser,
  fetchUserCreateMeta,
  fetchUserForEdit,
  updateUser,
} from '../admin-api'
import {
  emptyUserForm,
  avatarForUserForm,
  UserFormFields,
  type UserFormState,
} from '../components/UserFormFields'
import { toE164Mobile, toNationalMobile } from '@/lib/phone-country'

/** @deprecated Use modal on UsersIndexPage; routes redirect to the list. */
export function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { auth } = useAppContext()
  const [form, setForm] = useState<UserFormState>(() => emptyUserForm())

  const isSuperAdmin = auth.user?.type === 'superadmin'

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['users', 'create-meta'],
    queryFn: fetchUserCreateMeta,
    enabled: !isEdit,
  })

  const companiesContext =
    isSuperAdmin || Boolean(createMeta?.companies_context)

  usePageChrome({
    pageTitle: companiesContext
      ? isEdit
        ? t('Edit Company')
        : t('Create Company')
      : isEdit
        ? t('Edit User')
        : t('Create User'),
    breadcrumbs: [
      { label: companiesContext ? t('Companies') : t('Users'), url: paths.users.index },
      {
        label: companiesContext
          ? isEdit
            ? t('Edit Company')
            : t('Create Company')
          : isEdit
            ? t('Edit User')
            : t('Create User'),
      },
    ],
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['users', id, 'edit'],
    queryFn: () => fetchUserForEdit(id!),
    enabled: isEdit,
  })

  const roles = isEdit ? (editMeta?.roles ?? {}) : (createMeta?.roles ?? {})

  useEffect(() => {
    if (isEdit || !createMeta) return
    const firstRoleId = Object.keys(createMeta.roles)[0] ?? ''
    setForm((prev) => ({ ...prev, role_id: firstRoleId }))
  }, [createMeta, isEdit])

  useEffect(() => {
    if (!isEdit || !editMeta) return
    const profile = editMeta.company_profile
    const country = profile?.company_country || 'Nigeria'
    setForm({
      company_name: profile?.company_name ?? '',
      company_address: profile?.company_address ?? '',
      company_city: profile?.company_city ?? '',
      company_state: profile?.company_state ?? '',
      company_country: country,
      company_logo: profile?.company_logo ?? '',
      first_name: editMeta.user.first_name ?? '',
      middle_name: editMeta.user.middle_name ?? '',
      last_name: editMeta.user.last_name ?? '',
      email: editMeta.user.email,
      mobile_no: companiesContext
        ? toNationalMobile(editMeta.user.mobile_no ?? '', country)
        : (editMeta.user.mobile_no ?? ''),
      password: '',
      password_confirmation: '',
      role_id: editMeta.role_id ? String(editMeta.role_id) : '',
      avatar: avatarForUserForm(editMeta.user.avatar),
      is_enable_login: editMeta.user.is_enable_login,
    })
  }, [companiesContext, editMeta, isEdit])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const mobilePayload = companiesContext
        ? toE164Mobile(form.mobile_no, form.company_country || 'Nigeria')
        : form.mobile_no || undefined

      if (isEdit) {
        return updateUser(id!, {
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          last_name: form.last_name,
          email: form.email,
          mobile_no: mobilePayload,
          role_id: form.role_id ? Number(form.role_id) : undefined,
          is_enable_login: form.is_enable_login,
          ...(companiesContext
            ? {
                company_name: form.company_name,
                company_address: form.company_address || undefined,
                company_city: form.company_city || undefined,
                company_state: form.company_state || undefined,
                company_country: form.company_country || 'Nigeria',
                logo_dark: form.company_logo || '',
              }
            : { avatar: form.avatar || null }),
        })
      }
      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        email: form.email,
        mobile_no: mobilePayload,
        password: form.password,
        password_confirmation: form.password_confirmation,
        is_enable_login: form.is_enable_login,
        ...(companiesContext
          ? {
              company_name: form.company_name,
              company_address: form.company_address || undefined,
              company_city: form.company_city || undefined,
              company_state: form.company_state || undefined,
              company_country: form.company_country || 'Nigeria',
              ...(form.company_logo ? { logo_dark: form.company_logo } : {}),
            }
          : { avatar: form.avatar || undefined }),
      }
      if (!companiesContext && form.role_id) {
        return createUser({ ...payload, role_id: Number(form.role_id) })
      }
      return createUser(payload)
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t('The user details are updated successfully.')
          : t('The user has been created successfully.'),
      )
      navigate(paths.users.index)
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, isEdit ? t('Failed to update user') : t('Failed to create user')),
      ),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit) {
      if (!form.password || form.password !== form.password_confirmation) {
        toast.error(t('Passwords do not match'))
        return
      }
      if (!form.role_id && !companiesContext) {
        toast.error(t('Role is required.'))
        return
      }
    }
    if (companiesContext && !form.company_name.trim()) {
      toast.error(t('Company name is required.'))
      return
    }
    saveMutation.mutate()
  }

  const isLoading = isEdit ? editLoading : createLoading

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }

  if (isEdit && editMeta?.user.is_disable) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t('User is disabled')}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(paths.users.index)}>
            {t('Back to users')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm max-w-3xl">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-6">
          <UserFormFields
            form={form}
            onChange={setForm}
            isEdit={isEdit}
            companiesContext={companiesContext}
            roles={roles}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(paths.users.index)}>
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
