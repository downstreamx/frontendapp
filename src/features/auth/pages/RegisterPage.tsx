import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import InputError from '@/components/ui/input-error'
import { AuthLayout } from '@/layouts/auth-layout'
import { useRegisterMutation } from '../hooks'
import { paths } from '@/lib/paths'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { getApiErrorMessage } from '@/lib/errors'

const schema = z
  .object({
    first_name: z.string().min(1),
    middle_name: z.string().optional(),
    last_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = form.handleSubmit(async (values) => {
    const { me } = await registerMutation.mutateAsync({
      ...values,
      middle_name: values.middle_name || null,
    })
    navigate(resolveDefaultLandingPath(me))
  })

  const apiError =
    registerMutation.isError &&
    getApiErrorMessage(registerMutation.error, t('Registration failed.'))

  return (
    <AuthLayout
      title={t('Create an account')}
      description={t('Enter your details below to register')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">{t('First name')}</Label>
            <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} />
            <InputError message={form.formState.errors.first_name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middle_name">{t('Middle name')}</Label>
            <Input id="middle_name" autoComplete="additional-name" {...form.register('middle_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">{t('Last name')}</Label>
            <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} />
            <InputError message={form.formState.errors.last_name?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('Email address')}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          <InputError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('Password')}</Label>
          <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
          <InputError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password_confirmation">{t('Confirm password')}</Label>
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            {...form.register('password_confirmation')}
          />
          <InputError message={form.formState.errors.password_confirmation?.message} />
        </div>
        {apiError && <InputError message={apiError} />}
        <Button type="submit" className="w-full auth-primary" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? t('Loading...') : t('Register')}
        </Button>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          {t('Already have an account?')}{' '}
          <Link to={paths.login} className="text-primary hover:underline">
            {t('Log in')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
