import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import InputError from '@/components/ui/input-error'
import { AuthLayout } from '@/layouts/auth-layout'
import { useLoginMutation } from '../hooks'
import { paths } from '@/lib/paths'
import { resolveDefaultLandingPath } from '@/lib/resolve-default-landing-path'
import { useAppContext } from '@/contexts/app-context'
import { isDemoEnvironment } from '@/lib/brand-defaults'
import { getApiErrorMessage } from '@/lib/errors'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  {
    key: 'superadmin',
    email: 'superadmin@downstreamx.test',
    password: 'password',
    labelKey: 'Login as Super Admin',
    className: 'sm:col-span-2',
  },
  {
    key: 'company',
    email: 'company@downstreamx.test',
    password: 'password',
    labelKey: 'Login as Company',
  },
  {
    key: 'staff',
    email: 'hr1@demo.downstreamx.test',
    password: 'password',
    labelKey: 'Login as Employee',
  },
  {
    key: 'customer',
    email: 'customer.zenith-petroleum-marketers@demo.downstreamx.test',
    password: 'password',
    labelKey: 'Login as Customer',
  },
  {
    key: 'supplier',
    email: 'supplier.nnpc-products-supply@demo.downstreamx.test',
    password: 'password',
    labelKey: 'Login as Supplier',
  },
] as const

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginMutation = useLoginMutation()
  const { is_demo: isDemoFlag } = useAppContext()
  const isDemo = isDemoFlag || isDemoEnvironment()
  const status = searchParams.get('status') ?? undefined

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: isDemo ? 'company@downstreamx.test' : '',
      password: isDemo ? 'password' : '',
      remember: true,
    },
  })

  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  useEffect(() => {
    return () => form.resetField('password')
  }, [form])

  const submitLogin = async (values: FormValues) => {
    try {
      const { me } = await loginMutation.mutateAsync(values)
      navigate(resolveDefaultLandingPath(me))
    } catch {
      // Error surfaced via loginMutation.isError / apiError
    }
  }

  const onSubmit = form.handleSubmit(submitLogin)

  const handleQuickLogin = async (email: string, password: string, key: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
    setQuickLoading(key)
    try {
      const { me } = await loginMutation.mutateAsync({
        email,
        password,
        remember: form.getValues('remember'),
      })
      navigate(resolveDefaultLandingPath(me))
    } finally {
      setQuickLoading(null)
    }
  }

  const apiError =
    loginMutation.isError && getApiErrorMessage(loginMutation.error, t('Invalid credentials.'))

  return (
    <AuthLayout title={t('Log in to your account')}>
      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
          {status}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
              {t('Email address')}
            </Label>
            <Input
              id="email"
              type="email"
              autoFocus
              tabIndex={1}
              autoComplete="email"
              placeholder="email@example.com"
              className="w-full"
              {...form.register('email')}
            />
            <InputError message={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">
                {t('Password')}
              </Label>
              <Link
                to={paths.forgotPassword}
                className="text-sm auth-text-primary hover:underline"
                tabIndex={5}
              >
                {t('Forgot password?')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              tabIndex={2}
              autoComplete="current-password"
              placeholder={t('Password')}
              className="w-full"
              {...form.register('password')}
            />
            <InputError message={form.formState.errors.password?.message} />
          </div>

          <div className="flex items-center space-x-3 mt-4 mb-5">
            <Checkbox
              id="remember"
              checked={form.watch('remember')}
              onCheckedChange={(checked) => form.setValue('remember', !!checked)}
              tabIndex={3}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-300">
              {t('Remember me')}
            </Label>
          </div>

          {apiError && <InputError message={apiError} />}

          <Button
            type="submit"
            className="w-full auth-primary py-2.5 text-sm font-medium tracking-wide rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] mt-4"
            tabIndex={4}
            disabled={loginMutation.isPending || !!quickLoading}
            data-test="login-button"
          >
            {loginMutation.isPending ? t('Loading...') : t('SIGN IN')}
          </Button>
        </div>

        {isDemo && (
          <>
            <div className="mt-5 flex items-center">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <div className="w-2 h-2 rotate-45 mx-4 auth-primary" />
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 tracking-wider mb-4 text-center">
                {t('Quick Access')}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.key}
                    type="button"
                    disabled={loginMutation.isPending || !!quickLoading}
                    className={`group h-auto relative py-2 px-4 border text-[13px] font-medium text-white transition-all duration-200 rounded-md shadow-sm hover:shadow-md transform hover:scale-[1.02] auth-primary disabled:opacity-50 ${'className' in account ? account.className : ''}`}
                    onClick={() => handleQuickLogin(account.email, account.password, account.key)}
                  >
                    {quickLoading === account.key ? t('Loading...') : t(account.labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  )
}
