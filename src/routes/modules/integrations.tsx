import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { integrationProviders } from '@/lib/entity-registry'
import { IntegrationsHubPage } from '@/features/integrations/pages/IntegrationsHubPage'
import { IntegrationSettingsPage } from '@/features/integrations/pages/IntegrationSettingsPage'

export const integrationRoutes = (
  <>
    <Route path={paths.integrationsHub} element={<IntegrationsHubPage />} />
    {integrationProviders.map((provider) => (
      <Route
        key={provider}
        path={`/settings/integrations/${provider}`}
        element={<IntegrationSettingsPage provider={provider} />}
      />
    ))}
  </>
)
