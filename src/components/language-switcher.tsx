import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LANGUAGES = [
  { code: 'en', name: 'English', countryCode: 'US' },
  { code: 'fr', name: 'French', countryCode: 'FR' },
  { code: 'ar', name: 'Arabic', countryCode: 'SA' },
] as const

function countryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en')

  useEffect(() => {
    setCurrentLanguage(i18n.language || 'en')
  }, [i18n.language])

  const currentLang = LANGUAGES.find((lang) => lang.code === currentLanguage) ?? LANGUAGES[0]

  return (
    <Select
      value={currentLanguage}
      onValueChange={(code) => {
        setCurrentLanguage(code)
        void i18n.changeLanguage(code)
      }}
    >
      <SelectTrigger className="w-auto border shadow-sm bg-background hover:bg-muted/50 [&>svg]:hidden">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLang.name}</span>
          <span className="text-sm">{countryFlag(currentLang.countryCode)}</span>
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="max-h-48 overflow-y-auto">
        {LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{countryFlag(language.countryCode)}</span>
              <span>{t(language.name)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
