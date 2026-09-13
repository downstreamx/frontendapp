import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DistributionListPage } from '@/features/distribution/components/DistributionListPage'
import {
  distributionEntities,
  distributionEntityPageProps,
} from '@/features/distribution/distribution-entities'
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'

type Props = {
  entityKey: 'loading-schedules' | 'delivery-schedules' | 'delivery-confirmations'
  titleKey: string
  defaultStatus?: string
}

export function SalesDistributionListPage({ entityKey, titleKey, defaultStatus }: Props) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const entity = distributionEntities.find((e) => e.key === entityKey)

  useSalesPageChrome(t(titleKey), t(titleKey))

  useEffect(() => {
    if (!defaultStatus || searchParams.get('status')) return
    const next = new URLSearchParams(searchParams)
    next.set('status', defaultStatus)
    setSearchParams(next, { replace: true })
  }, [defaultStatus, searchParams, setSearchParams])

  if (!entity) return null

  return <DistributionListPage {...distributionEntityPageProps(entity)} title={t(titleKey)} />
}
