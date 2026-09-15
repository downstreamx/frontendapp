import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { changeUserPassword, fetchUserForEdit } from '../admin-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function UserChangePasswordPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const { data: editMeta, isLoading } = useQuery({
    queryKey: ['users', id, 'edit'],
    queryFn: () => fetchUserForEdit(id!),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: t('Change Password'),
    breadcrumbs: [
      { label: t('Users'), url: paths.users.index },
      { label: editMeta?.user.name ?? t('User') },
      { label: t('Change Password') },
    ],
  })

  const mutation = useMutation({
    mutationFn: () =>
      changeUserPassword(id!, {
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: () => {
      toast.success(t('The password changed successfully.'))
      navigate(paths.users.index)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to change password'))),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      toast.error(t('Passwords do not match'))
      return
    }
    mutation.mutate()
  }

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-lg shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('Change password for')} <span className="font-medium text-foreground">{editMeta?.user.name}</span>
          </p>
          <div className="space-y-1">
            <Label htmlFor="password">{t('Password')}</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Enter new password')}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
            <PasswordInput
              id="password_confirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder={t('Confirm new password')}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(paths.users.index)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('Changing...') : t('Change Password')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
