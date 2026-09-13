import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ConfigSections } from '../lib/landing-config'
import { isSectionVisible } from '../lib/landing-config'

type Props = {
  sectionKey: string
  config: ConfigSections
  title: string
  description: string
  icon: LucideIcon
  iconClassName?: string
  onVisibilityChange: (visible: boolean) => void
  children: ReactNode
}

export function LandingSectionCard({
  sectionKey,
  config,
  title,
  description,
  icon: Icon,
  iconClassName = 'bg-muted',
  onVisibilityChange,
  children,
}: Props) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconClassName}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-sm">{t('Enable Section')}</Label>
            <Switch
              checked={isSectionVisible(config, sectionKey)}
              onCheckedChange={onVisibilityChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
