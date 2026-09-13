import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { runDepreciation } from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetDepreciationPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))

  usePageChrome(t('Depreciation'), t('Assets'))

  const runMutation = useMutation({
    mutationFn: () => runDepreciation(period),
    onSuccess: () => toast.success(t('Depreciation posted.')),
    onError: (err: Error) => toast.error(err.message || t('Failed to run depreciation.')),
  })

  return (
    <div className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Monthly depreciation run')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('Posts depreciation for capitalized assets with a monthly amount. Requires GL accounts 5430 and 1610.')}
          </p>
          <div className="space-y-2">
            <Label>{t('Period (YYYY-MM)')}</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <Button disabled={runMutation.isPending} onClick={() => runMutation.mutate()}>
            {runMutation.isPending ? t('Running...') : t('Run depreciation')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
