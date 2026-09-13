import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthLayout } from '@/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { clearAuthToken, setAuthToken } from '@/lib/api'
import { useMeQuery } from '@/features/auth/hooks'
import { leaveImpersonation } from '@/features/admin/admin-api'
import { queryKeys } from '@/lib/query-keys'
import { getApiErrorMessage } from '@/lib/errors'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'

export function AccountBeingPreparedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const impersonating = Boolean(me?.impersonating)

  const leaveMutation = useMutation({
    mutationFn: leaveImpersonation,
    onSuccess: (result) => {
      setAuthToken(result.token)
      queryClient.setQueryData(queryKeys.auth.me(), {
        ...result.me,
        impersonating: false,
      })
      toast.success(t('Returned to your account'))
      navigate(resolveDefaultLandingPath(result.me), { replace: true })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to leave impersonation'))),
  })

  return (
    <AuthLayout
      title={t('Your account is being prepared')}
      description={t(
        'DownstreamX is still setting up your company workspace. Please contact your administrator for access once setup is complete.',
      )}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            'If you were given login details early, wait for confirmation that provisioning has finished, then sign in again.',
          )}
        </p>
        {impersonating ? (
          <Button
            type="button"
            className="w-full"
            variant="outline"
            disabled={leaveMutation.isPending}
            onClick={() => leaveMutation.mutate()}
          >
            {leaveMutation.isPending ? t('Loading...') : t('Leave impersonation')}
          </Button>
        ) : (
          <Button type="button" className="w-full" variant="outline" asChild>
            <Link
              to={paths.login}
              onClick={() => {
                clearAuthToken()
                queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
              }}
            >
              {t('Back to login')}
            </Link>
          </Button>
        )}
      </div>
    </AuthLayout>
  )
}
