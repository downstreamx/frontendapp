import { type PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { useBrand } from '@/contexts/brand-context'
import { useFavicon } from '@/hooks/use-favicon'
import { getImagePath } from '@/utils/helpers'
import ApplicationLogo from '@/components/application-logo'
import CookieConsent from '@/components/cookie-consent'
import { useAppContext } from '@/contexts/app-context'
import { paths } from '@/lib/paths'
import { AuthBackground } from '@/layouts/auth/auth-background'

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
  const brandName = settings.titleText || 'DownstreamX'

  return (
    <div className="auth-shell relative min-h-screen overflow-hidden bg-[#070d14]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');
        .auth-shell {
          font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
        }
        .auth-shell h1,
        .auth-shell .auth-brand-type {
          font-family: Outfit, 'Source Sans 3', sans-serif;
        }
        .auth-primary {
          background-color: ${primaryColor} !important;
          color: white !important;
        }
        .auth-primary:hover {
          background-color: ${primaryColor}e6 !important;
        }
        .auth-primary:disabled {
          opacity: 0.65;
        }
        .auth-text-primary {
          color: ${primaryColor} !important;
        }
        .auth-card-enter {
          animation: auth-card-enter 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes auth-card-enter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-card-enter {
            animation: none;
          }
        }
      `}</style>

      <AuthBackground primaryColor={primaryColor} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="auth-card-enter w-full max-w-[440px]">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-80"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}66 0%, transparent 38%, transparent 62%, #ffb34755 100%)`,
              }}
            />

            <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md">
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, #1a9f6e 55%, #ffb347 100%)`,
                }}
              />

              <div className="px-6 pb-7 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
                <div className="mb-7 text-center">
                  <Link
                    to={paths.login}
                    className="auth-brand-type inline-flex max-w-[280px] flex-col items-center gap-3 transition-opacity hover:opacity-90"
                    aria-label={brandName}
                  >
                    {logoSrc ? (
                      <img
                        src={getImagePath(logoSrc, imageUrlPrefix)}
                        alt={brandName}
                        className="mx-auto max-h-16 w-auto object-contain sm:max-h-[4.5rem]"
                      />
                    ) : (
                      <ApplicationLogo
                        className="mx-auto max-h-16 sm:max-h-[4.5rem]"
                        alt={brandName}
                      />
                    )}
                  </Link>
                </div>

                {title ? (
                  <div className="mb-6 text-center">
                    <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.85rem]">
                      {title}
                    </h1>
                    <div
                      className="mx-auto mt-3 h-1 w-10 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                    {description ? (
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">
                        {description}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {children}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/55">{settings.footerText}</p>
          </div>
        </div>
      </div>
      <CookieConsent settings={adminAllSetting || {}} />
    </div>
  )
}
