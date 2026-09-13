import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import InputError from '@/components/ui/input-error'
import { AuthLayout } from '@/layouts/auth-layout'
import { useForgotPasswordMutation } from '../hooks'
import { paths } from '@/lib/paths'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/errors'

const schema = z.object({ email: z.string().email() })

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const mutation = useForgotPasswordMutation()
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values.email)
    toast.success(t('If that email exists, a reset link was sent.'))
  })

  const apiError =
    mutation.isError && getApiErrorMessage(mutation.error, t('Unable to send reset link.'))

  return (
    <AuthLayout
      title={t('Forgot password')}
      description={t('Enter your email to receive a password reset link')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('Email address')}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          <InputError message={form.formState.errors.email?.message} />
        </div>
        {apiError && <InputError message={apiError} />}
        <Button type="submit" className="w-full auth-primary" disabled={mutation.isPending}>
          {mutation.isPending ? t('Loading...') : t('Send reset link')}
        </Button>
        <p className="text-sm text-center">
          <Link to={paths.login} className="auth-text-primary hover:underline">
            {t('Back to login')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
