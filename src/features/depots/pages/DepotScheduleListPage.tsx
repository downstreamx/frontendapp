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
import { useDepotPageChrome } from '../hooks/use-depot-page-chrome'

type Props = {
  profileKey: Extract<ScheduleViewProfileKey, 'depot-loading' | 'depot-receiving'>
}

export function DepotScheduleListPage({ profileKey }: Props) {
  const { t } = useTranslation()
  const profile = scheduleViewProfileByKey(profileKey)
  const entity = distributionEntities.find((e) => e.key === profile.entityKey)
  const pageTitle = t(profile.title)

  useDepotPageChrome(pageTitle)

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
