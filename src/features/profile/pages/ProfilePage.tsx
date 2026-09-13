import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneInputComponent } from '@/components/ui/phone-input'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useMeQuery, useUpdateMeMutation } from '@/features/auth/hooks'
import { updatePassword } from '@/features/auth/api'
import { getApiErrorMessage } from '@/lib/errors'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'

const profileSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  last_name: z.string().min(1),
  email: z.string().email(),
  mobile_no: z.string().optional(),
  avatar: z.string().optional(),
  slug: z.string().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  })

export function ProfilePage() {
  const { t } = useTranslation()
  const { data: me } = useMeQuery()
  const updateMe = useUpdateMeMutation()
  const { auth, imageUrlPrefix } = useAppContext()
  const isCompany = auth.user?.type === 'company'

  usePageChrome({
    pageTitle: t('Profile Settings'),
    breadcrumbs: [{ label: t('Profile') }],
  })

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      mobile_no: '',
      avatar: '',
      slug: '',
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })

  const avatar = profileForm.watch('avatar')

  useEffect(() => {
    const user = me?.user
    if (!user) return
    profileForm.reset({
      first_name: user.first_name ?? '',
      middle_name: user.middle_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      mobile_no: user.mobile_no ?? '',
      avatar: user.avatar ?? '',
      slug: user.slug ?? '',
    })
  }, [me?.user, profileForm])

  const changePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success(t('Password updated successfully'))
      passwordForm.reset()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update password'))),
  })

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="shadow-sm min-h-[500px]">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-base">{t('Profile Information')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Details about your personal information')}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                className="space-y-6"
                onSubmit={profileForm.handleSubmit(async (values) => {
                  try {
                    await updateMe.mutateAsync({
                      first_name: values.first_name,
                      middle_name: values.middle_name || null,
                      last_name: values.last_name,
                      email: values.email,
                      mobile_no: values.mobile_no || null,
                      avatar: values.avatar || null,
                      ...(isCompany ? { slug: values.slug || null } : {}),
                    })
                    toast.success(t('Profile updated successfully'))
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, t('Failed to update profile')))
                  }
                })}
              >
                <div className="space-y-2">
                  <Label>{t('Avatar')}</Label>
                  <div className="flex gap-6 items-center mt-3">
                    <UserAvatar
                      avatar={avatar}
                      name={me?.user?.name ?? t('Avatar Preview')}
                      size="xl"
                      rounded="md"
                      className="border-2 border-border shrink-0"
                      imageUrlPrefix={imageUrlPrefix}
                    />
                    <div className="flex-1 min-w-0">
                      <MediaPicker
                        value={profileForm.watch('avatar') ?? ''}
                        onChange={(value) =>
                          profileForm.setValue('avatar', typeof value === 'string' ? value : value[0] ?? '')
                        }
                        placeholder={t('Select avatar image...')}
                        showPreview={false}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('Upload a profile picture. Recommended size: 200x200px')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('First name')}</Label>
                    <Input
                      id="first_name"
                      autoComplete="given-name"
                      placeholder={t('Enter your first name')}
                      {...profileForm.register('first_name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">{t('Middle name')}</Label>
                    <Input
                      id="middle_name"
                      autoComplete="additional-name"
                      placeholder={t('Enter your middle name (optional)')}
                      {...profileForm.register('middle_name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('Last name')}</Label>
                    <Input
                      id="last_name"
                      autoComplete="family-name"
                      placeholder={t('Enter your last name')}
                      {...profileForm.register('last_name')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder={t('Enter your email address')}
                    {...profileForm.register('email')}
                  />
                </div>

                <PhoneInputComponent
                  id="mobile_no"
                  label={t('Mobile Number')}
                  value={profileForm.watch('mobile_no') ?? ''}
                  onChange={(value) => profileForm.setValue('mobile_no', value)}
                  placeholder="+1234567890"
                  error={profileForm.formState.errors.mobile_no?.message}
                />

                {isCompany && (
                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('URL Slug')}</Label>
                    <Input
                      id="slug"
                      autoComplete="off"
                      placeholder={t('Enter custom URL slug (e.g., my-business)')}
                      {...profileForm.register('slug')}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateMe.isPending}>
                    {updateMe.isPending ? t('Saving...') : t('Save Changes')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm min-h-[500px]">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-base">{t('Change Password')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Details about your account password change')}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                className="space-y-6"
                onSubmit={passwordForm.handleSubmit((values) => changePasswordMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <Label htmlFor="current_password">{t('Current Password')}</Label>
                  <PasswordInput
                    id="current_password"
                    autoComplete="current-password"
                    placeholder={t('Enter current password')}
                    {...passwordForm.register('current_password')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('New Password')}</Label>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    placeholder={t('Enter new password')}
                    {...passwordForm.register('password')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
                  <PasswordInput
                    id="password_confirmation"
                    autoComplete="new-password"
                    placeholder={t('Confirm new password')}
                    {...passwordForm.register('password_confirmation')}
                  />
                  {passwordForm.formState.errors.password_confirmation && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.password_confirmation.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? t('Saving...') : t('Save Changes')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
