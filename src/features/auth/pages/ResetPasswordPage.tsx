import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useResetPasswordMutation } from '../hooks'
import { paths } from '@/lib/paths'
import { toast } from 'sonner'

const schema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  })

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const mutation = useResetPasswordMutation()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: params.get('email') ?? '',
      token: params.get('token') ?? '',
      password: '',
      password_confirmation: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    toast.success('Password updated. You can sign in.')
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input id="token" {...form.register('token')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput id="password" {...form.register('password')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm</Label>
              <PasswordInput id="password_confirmation" {...form.register('password_confirmation')} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              Reset password
            </Button>
            <p className="text-sm text-center">
              <Link to={paths.login} className="text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
