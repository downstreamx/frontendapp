import { useTranslation } from 'react-i18next'
import { DistributionListPage } from '@/features/distribution/components/DistributionListPage'
import {
  distributionEntities,
  distributionEntityPageProps,
} from '@/features/distribution/distribution-entities'
import {
  scheduleViewProfileByKey,
  type ScheduleViewProfileKey,
} from '@/features/distribution/schedule-view-profiles'
import { useFleetPageChrome } from '../hooks/use-fleet-page-chrome'

type Props = {
  profileKey: ScheduleViewProfileKey
}

export function FleetScheduleListPage({ profileKey }: Props) {
  const { t } = useTranslation()
  const profile = scheduleViewProfileByKey(profileKey)
  const entity = distributionEntities.find((e) => e.key === profile.entityKey)
  const pageTitle = t(profile.title)

  useFleetPageChrome(pageTitle)

  if (!entity) return null

  return (
    <DistributionListPage
      {...distributionEntityPageProps(entity)}
      title={pageTitle}
      singularTitle={t(profile.singularTitle)}
      viewProfile={profile}
      suppressPageChrome
    />
  )
}
