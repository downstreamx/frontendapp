import { Navigate, Route } from 'react-router-dom'
import { SYSTEM_SETUP_MODULES } from '@/lib/system-setup-registry'
import { SystemSetupHubRedirect } from '@/features/shared/components/SystemSetupHubRedirect'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'
import { DistributionSystemSetupPage } from '@/features/distribution/pages/DistributionSystemSetupPage'
import { CategoriesIndexPage } from '@/features/inventory/pages/CategoriesIndexPage'
import { UnitsIndexPage } from '@/features/inventory/pages/UnitsIndexPage'
import { TaxesIndexPage } from '@/features/inventory/pages/TaxesIndexPage'
import { paths } from '@/lib/paths'
import { SalesPaymentReminderSettingsPage } from '@/features/sales/pages/SalesPaymentReminderSettingsPage'
import { SalesCommercialLineItemSettingsPage } from '@/features/sales/pages/SalesCommercialLineItemSettingsPage'
import { PurchaseCommercialLineItemSettingsPage } from '@/features/purchase/pages/PurchaseCommercialLineItemSettingsPage'
import { PurchasePaymentReminderSettingsPage } from '@/features/purchase/pages/PurchasePaymentReminderSettingsPage'
import { StageTemplatesPage } from '@/features/vendor-management/pages/StageTemplatesPage'
import {
  SupportCategoriesInfoPage,
  SupportContactInformationPage,
  SupportCtaSectionsPage,
  SupportTitleSectionsPage,
} from '@/features/support/pages/support-system-setup-pages'

export const systemSetupHubRoutes = (
  <>
    {SYSTEM_SETUP_MODULES.map((module) => (
      <Route
        key={module.key}
        path={module.hubPath}
        element={<SystemSetupHubRedirect moduleKey={module.key} />}
      />
    ))}
    <Route
      path="/lead/pipelines"
      element={
        <SystemSetupLayout moduleKey="lead">
          <SystemSetupEntityPage
            moduleKey="lead"
            itemKey="pipelines"
            permissions={{
              create: 'create-pipelines',
              edit: 'edit-pipelines',
              delete: 'delete-pipelines',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/training/training-types"
      element={
        <SystemSetupLayout moduleKey="training">
          <SystemSetupEntityPage moduleKey="training" itemKey="training-types" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/performance/indicator-categories"
      element={
        <SystemSetupLayout moduleKey="performance">
          <SystemSetupEntityPage moduleKey="performance" itemKey="indicator-categories" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/recruitment/job-categories"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <SystemSetupEntityPage moduleKey="recruitment" itemKey="job-categories" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/recruitment/job-types"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <SystemSetupEntityPage moduleKey="recruitment" itemKey="job-types" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/recruitment/candidate-sources"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <SystemSetupEntityPage moduleKey="recruitment" itemKey="candidate-sources" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/recruitment/interview-types"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <SystemSetupEntityPage moduleKey="recruitment" itemKey="interview-types" />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/recruitment/onboarding-checklists"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <SystemSetupEntityPage
            moduleKey="recruitment"
            itemKey="onboarding-checklists"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/categories"
      element={
        <SystemSetupLayout moduleKey="support">
          <SystemSetupEntityPage
            moduleKey="support"
            itemKey="categories"
            permissions={{
              create: 'create-ticket-categories',
              edit: 'edit-ticket-categories',
              delete: 'delete-ticket-categories',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/support-categories"
      element={
        <SystemSetupLayout moduleKey="support">
          <SupportCategoriesInfoPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/knowledge-categories"
      element={
        <SystemSetupLayout moduleKey="support">
          <SystemSetupEntityPage
            moduleKey="support"
            itemKey="knowledge-categories"
            fields={[{ name: 'title', label: 'Title', required: true }]}
            permissions={{
              create: 'create-knowledge-base',
              edit: 'edit-knowledge-base',
              delete: 'delete-knowledge-base',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/custom-pages"
      element={
        <SystemSetupLayout moduleKey="support">
          <SystemSetupEntityPage
            moduleKey="support"
            itemKey="custom-pages"
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'slug', label: 'Slug' },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'contents', label: 'Contents', type: 'textarea' },
              {
                name: 'enable_page_footer',
                label: 'Enable page footer',
                type: 'select',
                options: [
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ],
              },
            ]}
            permissions={{
              create: 'manage-support-settings',
              edit: 'manage-support-settings',
              delete: 'manage-support-settings',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/title-sections"
      element={
        <SystemSetupLayout moduleKey="support">
          <SupportTitleSectionsPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/cta-sections"
      element={
        <SystemSetupLayout moduleKey="support">
          <SupportCtaSectionsPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/quick-links"
      element={
        <SystemSetupLayout moduleKey="support">
          <SystemSetupEntityPage
            moduleKey="support"
            itemKey="quick-links"
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'icon', label: 'Icon', required: true },
              { name: 'link', label: 'Link', required: true },
            ]}
            permissions={{
              create: 'manage-support-settings',
              edit: 'manage-support-settings',
              delete: 'manage-support-settings',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/support-ticket/contact-information"
      element={
        <SystemSetupLayout moduleKey="support">
          <SupportContactInformationPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/project/task-stages"
      element={
        <SystemSetupLayout moduleKey="project">
          <SystemSetupEntityPage
            moduleKey="project"
            itemKey="task-stages"
            permissions={{
              create: 'create-task-stages',
              edit: 'edit-task-stages',
              delete: 'delete-task-stages',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.distribution.systemSetupMovementTypes}
      element={
        <SystemSetupLayout moduleKey="distribution">
          <DistributionSystemSetupPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.fleet.systemSetupTruckProviderTypes}
      element={
        <SystemSetupLayout moduleKey="fleet">
          <SystemSetupEntityPage
            moduleKey="fleet"
            itemKey="truck-provider-types"
            permissions={{
              create: 'create-truck-provider-types',
              edit: 'edit-truck-provider-types',
              delete: 'delete-truck-provider-types',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.fleet.systemSetupTruckFuelTypes}
      element={
        <SystemSetupLayout moduleKey="fleet">
          <SystemSetupEntityPage
            moduleKey="fleet"
            itemKey="truck-fuel-types"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'code', label: 'Code (optional)' },
            ]}
            permissions={{
              create: 'create-truck-fuel-types',
              edit: 'edit-truck-fuel-types',
              delete: 'delete-truck-fuel-types',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.fleet.systemSetupTruckComplianceTypes}
      element={
        <SystemSetupLayout moduleKey="fleet">
          <SystemSetupEntityPage
            moduleKey="fleet"
            itemKey="truck-compliance-types"
            permissions={{
              create: 'create-truck-compliance-types',
              edit: 'edit-truck-compliance-types',
              delete: 'delete-truck-compliance-types',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.vendorManagement.systemSetupPipelineStages}
      element={
        <SystemSetupLayout moduleKey="vendor-management">
          <StageTemplatesPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/vendor-management/stage-templates"
      element={<Navigate to={paths.vendorManagement.systemSetupPipelineStages} replace />}
    />
    <Route
      path={paths.procurement.systemSetupPaymentTerms}
      element={
        <SystemSetupLayout moduleKey="procurement">
          <SystemSetupEntityPage
            moduleKey="procurement"
            itemKey="payment-terms"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'code', label: 'Code (optional)' },
              { name: 'net_days', label: 'Net days', type: 'number', min: 0 },
              {
                name: 'is_credit',
                label: 'Credit terms',
                type: 'checkbox',
                description:
                  'When enabled, posting an invoice with this term unlocks bridging or distribution entitlements without a cleared payment.',
              },
            ]}
            permissions={{
              create: 'create-procurement-payment-terms',
              edit: 'edit-procurement-payment-terms',
              delete: 'delete-procurement-payment-terms',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.procurement.systemSetupSupplierCategories}
      element={
        <SystemSetupLayout moduleKey="procurement">
          <SystemSetupEntityPage
            moduleKey="procurement"
            itemKey="supplier-categories"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'code', label: 'Code (optional)' },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
            permissions={{
              create: 'create-supplier-categories',
              edit: 'edit-supplier-categories',
              delete: 'delete-supplier-categories',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.procurement.systemSetupLineItems}
      element={
        <SystemSetupLayout moduleKey="procurement">
          <PurchaseCommercialLineItemSettingsPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.procurement.systemSetupPaymentReminders}
      element={
        <SystemSetupLayout moduleKey="procurement">
          <PurchasePaymentReminderSettingsPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.sales.systemSetupPaymentTerms}
      element={
        <SystemSetupLayout moduleKey="sales">
          <SystemSetupEntityPage
            moduleKey="sales"
            itemKey="payment-terms"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'code', label: 'Code (optional)' },
              { name: 'net_days', label: 'Net days', type: 'number', min: 0 },
              {
                name: 'is_credit',
                label: 'Credit terms',
                type: 'checkbox',
                description:
                  'When enabled, posting an invoice with this term unlocks bridging or distribution entitlements without a cleared payment.',
              },
            ]}
            permissions={{
              create: 'create-sales-payment-terms',
              edit: 'edit-sales-payment-terms',
              delete: 'delete-sales-payment-terms',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.sales.systemSetupCustomerCategories}
      element={
        <SystemSetupLayout moduleKey="sales">
          <SystemSetupEntityPage
            moduleKey="sales"
            itemKey="customer-categories"
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'code', label: 'Code (optional)' },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
            permissions={{
              create: 'create-customer-categories',
              edit: 'edit-customer-categories',
              delete: 'delete-customer-categories',
            }}
          />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.sales.systemSetupPaymentReminders}
      element={
        <SystemSetupLayout moduleKey="sales">
          <SalesPaymentReminderSettingsPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.sales.systemSetupLineItems}
      element={
        <SystemSetupLayout moduleKey="sales">
          <SalesCommercialLineItemSettingsPage />
        </SystemSetupLayout>
      }
    />
  </>
)

export const inventorySystemSetupRoutes = (
  <>
    <Route
      path={paths.inventory.categories}
      element={
        <SystemSetupLayout moduleKey="inventory">
          <CategoriesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.inventory.taxes}
      element={
        <SystemSetupLayout moduleKey="inventory">
          <TaxesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.inventory.units}
      element={
        <SystemSetupLayout moduleKey="inventory">
          <UnitsIndexPage />
        </SystemSetupLayout>
      }
    />
  </>
)
