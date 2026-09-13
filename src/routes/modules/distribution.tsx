import { Route } from 'react-router-dom'
import { DistributionListPage } from '@/features/distribution/components/DistributionListPage'
import { DistributionShowPage } from '@/features/distribution/pages/DistributionShowPage'
import {
  DistributionCreateRedirect,
  DistributionEditRedirect,
} from '@/features/distribution/components/DistributionRouteRedirects'
import { DistributionInformationPage } from '@/features/distribution/pages/DistributionInformationPage'
import { DistributionTransitMonitoringIndexPage } from '@/features/distribution/pages/DistributionTransitMonitoringIndexPage'
import { EmptyTrucksInTransitIndexPage } from '@/features/distribution/pages/EmptyTrucksInTransitIndexPage'
import { TrucksInTransitIndexPage } from '@/features/distribution/pages/TrucksInTransitIndexPage'
import {
  distributionEntities,
  distributionEntityPageProps,
} from '@/features/distribution/distribution-entities'
import { DepotScheduleListPage } from '@/features/depots/pages/DepotScheduleListPage'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { paths } from '@/lib/paths'

const SCHEDULE_PROFILE_ENTITIES = new Set(['loading-schedules', 'receiving-schedules'])

const genericDistributionEntities = distributionEntities.filter(
  (entity) => !SCHEDULE_PROFILE_ENTITIES.has(entity.key),
)

export const distributionRoutes = (
  <>
    <Route
      path={paths.distribution.loadingSchedules}
      element={<DepotScheduleListPage profileKey="depot-loading" />}
    />
    <Route
      path={paths.distribution.receivingSchedules}
      element={<DepotScheduleListPage profileKey="depot-receiving" />}
    />
    {genericDistributionEntities.map((entity) => (
      <Route
        key={entity.key}
        path={entity.listPath}
        element={<DistributionListPage {...distributionEntityPageProps(entity)} />}
      />
    ))}
    {distributionEntities.map((entity) => (
      <Route
        key={`${entity.key}-create`}
        path={entity.createPath}
        element={<DistributionCreateRedirect listPath={entity.listPath} />}
      />
    ))}
    {distributionEntities.map((entity) => (
      <Route
        key={`${entity.key}-edit`}
        path={entity.editPath(':id')}
        element={<DistributionEditRedirect listPath={entity.listPath} />}
      />
    ))}
    {distributionEntities.map((entity) => (
      <Route
        key={`${entity.key}-show`}
        path={entity.showPath(':id')}
        element={
          <DistributionShowPage
            title={entity.singularTitle}
            apiPath={entity.apiPath}
            listPath={entity.listPath}
            createPath={entity.createPath}
            editPath={entity.editPath}
            entityKey={entity.key}
            labelKeys={entity.labelKeys}
            postAction={entity.postAction}
          />
        }
      />
    ))}
    <Route path={paths.distribution.transit} element={<DistributionTransitMonitoringIndexPage />} />
    <Route path={paths.distribution.information} element={<DistributionInformationPage />} />
    <Route
      path={paths.distribution.emptyTrucksInTransit}
      element={<EmptyTrucksInTransitIndexPage />}
    />
    <Route path={paths.distribution.goodsInTransit} element={<TrucksInTransitIndexPage />} />
    <Route path="/distribution/*" element={<ModuleIndexPage />} />
  </>
)
