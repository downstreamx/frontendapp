import { type PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { useBrand } from '@/contexts/brand-context'
import { useFavicon } from '@/hooks/use-favicon'
import { getImagePath } from '@/utils/helpers'
import ApplicationLogo from '@/components/application-logo'
import CookieConsent from '@/components/cookie-consent'
import { useAppContext } from '@/contexts/app-context'
import { paths } from '@/lib/paths'
import loginBg from '@/assets/login-bg-01.jpg'

interface AuthLayoutProps {
  title?: string
  description?: string
}

export function AuthSimpleLayout({
  children,
  title,
  description,
}: PropsWithChildren<AuthLayoutProps>) {
  const { settings, getPrimaryColor } = useBrand()
  const { adminAllSetting, imageUrlPrefix } = useAppContext()
  useFavicon()

  const logoSrc =
    settings.themeMode === 'dark'
      ? settings.logo_light || settings.logo_dark
      : settings.logo_dark || settings.logo_light
  const primaryColor = getPrimaryColor()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <style>{`
        .auth-primary {
          background-color: ${primaryColor} !important;
          color: white !important;
        }
        .auth-primary:hover {
          background-color: ${primaryColor}dd !important;
        }
        .auth-text-primary {
          color: ${primaryColor} !important;
        }
      `}</style>

      <div aria-hidden className="absolute inset-0">
        <img src={loginBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, ${primaryColor} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="relative">
            <div
              className="absolute -left-3 -top-3 h-6 w-6 rounded-tl-md border-l-2 border-t-2"
              style={{ borderColor: primaryColor }}
            />
            <div
              className="absolute -bottom-3 -right-3 h-6 w-6 rounded-br-md border-b-2 border-r-2"
              style={{ borderColor: primaryColor }}
            />

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-8 lg:pt-5">
              <div className="mb-6 text-center">
                <Link to={paths.dashboard} className="inline-block max-w-[220px]">
                  {logoSrc ? (
                    <img
                      src={getImagePath(logoSrc, imageUrlPrefix)}
                      alt={settings.titleText || 'Logo'}
                      className="mx-auto max-h-14 w-auto"
                    />
                  ) : (
                    <ApplicationLogo className="mx-auto h-10 w-10 auth-text-primary" />
                  )}
                </Link>
              </div>

              {title && (
                <div className="mb-4 text-center">
                  <h1 className="mb-1.5 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                  <div
                    className="mx-auto mb-2.5 h-px w-12"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
                  )}
                </div>
              )}

              {children}
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 rounded-md border border-gray-200 bg-white/90 px-4 py-2 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-sm text-gray-500 dark:text-gray-400">{settings.footerText}</p>
            </div>
          </div>
        </div>
      </div>
      <CookieConsent settings={adminAllSetting || {}} />
    </div>
  )
}
