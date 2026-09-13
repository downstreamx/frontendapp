import { type ReactNode } from 'react'
import { BrandProvider } from '@/contexts/brand-context'
import { useFlashMessages } from '@/hooks/useFlashMessages'
import { AuthSimpleLayout } from '@/layouts/auth/auth-simple-layout'

export function AuthLayout({
  children,
  title,
  description,
}: {
  children: ReactNode
  title: string
  description?: string
}) {
  useFlashMessages()

  return (
    <BrandProvider>
      <AuthSimpleLayout title={title} description={description}>
        {children}
      </AuthSimpleLayout>
    </BrandProvider>
  )
}
