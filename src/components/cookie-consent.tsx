import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { useAppContext } from '@/contexts/app-context';
import { route } from '@/lib/route';
import { paths } from '@/lib/paths';

interface CookieConsentProps {
  settings: {
    enableCookiePopup?: boolean;
    strictlyNecessaryCookies?: boolean;
    cookieTitle?: string;
    cookieDescription?: string;
    strictlyCookieTitle?: string;
    strictlyCookieDescription?: string;
    contactUsDescription?: string;
    contactUsUrl?: string;
  };
}

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

export default function CookieConsent({ settings }: CookieConsentProps) {
  const { t } = useTranslation();
  const { auth, is_demo: isDemoFlag } = useAppContext();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent && settings.enableCookiePopup) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to read cookie consent:', error);
      if (settings.enableCookiePopup) {
        setIsVisible(true);
      }
    }
  }, [settings.enableCookiePopup]);

  const logCookieConsent = (consent: CookiePreferences) => {
    router.post(route('cookie.consent.log'), {
      consent,
      ip: window.location.hostname,
      userAgent: navigator.userAgent,
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {},
      onError: () => {},
    });
  };

  const createConsent = (preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }): CookiePreferences => ({
    ...preferences,
    timestamp: Date.now(),
  });

  const saveConsent = (consent: CookiePreferences) => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(consent));
      logCookieConsent(consent);
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  };

  const handleAcceptAll = () => {
    saveConsent(createConsent({ necessary: true, analytics: true, marketing: true }));
  };

  const handleAcceptSelected = () => {
    saveConsent(createConsent(acceptedCookies));
  };

  const handleReject = () => {
    saveConsent(createConsent({ necessary: true, analytics: false, marketing: false }));
  };

  const isDemo = isDemoFlag;
  const isDashboard =
    location.pathname === paths.dashboard || location.pathname.startsWith('/account');

  if (!isVisible || !settings.enableCookiePopup) {
    return null;
  }

  if (isDemo && (!auth.user || !isDashboard)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[900px] max-w-[95vw]">
      <div className="bg-background border border-border rounded-xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-start justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">
              {settings.cookieTitle || t('Cookie Consent')}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                {settings.cookieDescription}
              </p>

              {settings.strictlyNecessaryCookies && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {settings.strictlyCookieTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {settings.strictlyCookieDescription}
                    </p>
                  </div>
                  <Switch checked={true} disabled className="ml-2" />
                </div>
              )}

              {settings.contactUsUrl && (
                <p className="text-xs text-muted-foreground">
                  {settings.contactUsDescription}{' '}
                  <a href={settings.contactUsUrl} className="text-primary hover:underline font-medium">
                    {t('Contact us')}
                  </a>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button size="sm" onClick={handleAcceptAll} className="w-full bg-green-600 hover:bg-green-700">
                {t('Accept All')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleAcceptSelected} className="w-full">
                {t('Accept Selected')}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} className="w-full">
                {t('Reject')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
